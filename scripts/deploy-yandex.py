"""Выкладка сборки в Yandex Object Storage: https://prokormi.website.yandexcloud.net

Статический ключ сервисного аккаунта лежит вне репозитория, в ~/.yc-prokormi.env:
    YC_ACCESS_KEY_ID=...
    YC_SECRET_ACCESS_KEY=...

    npm run deploy:yandex                           # сборка + загрузка изменённых файлов в бакет prokormi
    python scripts/deploy-yandex.py setup prokormi  # создать бакет с публичным чтением и режимом сайта
"""
import os, sys, mimetypes, hashlib
from concurrent.futures import ThreadPoolExecutor
import boto3
from botocore.config import Config

env = {}
for line in open(os.environ.get("YC_ENV_FILE", os.path.expanduser("~/.yc-prokormi.env")), encoding="utf-8-sig"):
    if "=" in line:
        k, v = line.strip().split("=", 1)
        env[k.strip()] = v.strip()

s3 = boto3.client(
    "s3",
    endpoint_url="https://storage.yandexcloud.net",
    region_name="ru-central1",
    aws_access_key_id=env["YC_ACCESS_KEY_ID"],
    aws_secret_access_key=env["YC_SECRET_ACCESS_KEY"],
    config=Config(retries={"max_attempts": 8}, max_pool_connections=16),
)

EXTRA_TYPES = {
    ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
    ".html": "text/html", ".json": "application/json", ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json", ".wasm": "application/wasm", ".mp4": "video/mp4",
    ".webm": "video/webm", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
    ".svg": "image/svg+xml", ".ico": "image/x-icon", ".ktx2": "image/ktx2",
    ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain",
}

def ctype(path):
    ext = os.path.splitext(path)[1].lower()
    t = EXTRA_TYPES.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"
    if t.startswith("text/") or t in ("application/json", "image/svg+xml", "model/gltf+json"):
        t += "; charset=utf-8"
    return t

def cache(key):
    if key.endswith(".html"):
        return "no-cache"
    if key.startswith("assets/"):
        return "public, max-age=31536000, immutable"
    return "public, max-age=3600"

cmd = sys.argv[1] if len(sys.argv) > 1 else "upload"
bucket = sys.argv[2] if len(sys.argv) > 2 else "prokormi"

if cmd == "list":
    print([b["Name"] for b in s3.list_buckets().get("Buckets", [])])
elif cmd == "setup":
    try:
        s3.create_bucket(Bucket=bucket, ACL="public-read")
        print("created", bucket)
    except s3.exceptions.BucketAlreadyOwnedByYou:
        print("already mine", bucket)
    s3.put_bucket_acl(Bucket=bucket, ACL="public-read")
    s3.put_bucket_website(Bucket=bucket, WebsiteConfiguration={
        "IndexDocument": {"Suffix": "index.html"},
        "ErrorDocument": {"Key": "index.html"},
    })
    print("website on")
elif cmd == "upload":
    root = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
    existing = {}
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket):
        for o in page.get("Contents", []):
            existing[o["Key"]] = (o["Size"], o["ETag"].strip('"'))
    files = []
    for d, _, fs in os.walk(root):
        for f in fs:
            p = os.path.join(d, f)
            files.append((p, os.path.relpath(p, root).replace("\\", "/")))
    def md5(p):
        h = hashlib.md5()
        with open(p, "rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                h.update(chunk)
        return h.hexdigest()
    todo = [(p, k) for p, k in files
            if k not in existing or existing[k][0] != os.path.getsize(p)
            or ("-" not in existing[k][1] and existing[k][1] != md5(p))]
    print(f"{len(files)} files, {len(todo)} to upload", flush=True)
    done = [0]
    def up(item):
        p, k = item
        s3.upload_file(p, bucket, k, ExtraArgs={"ContentType": ctype(k), "CacheControl": cache(k)})
        done[0] += 1
        if done[0] % 25 == 0:
            print(f"  {done[0]}/{len(todo)}", flush=True)
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(up, todo))
    local = {k for _, k in files}
    stale = [k for k in existing if k not in local]
    for i in range(0, len(stale), 1000):
        s3.delete_objects(Bucket=bucket, Delete={"Objects": [{"Key": k} for k in stale[i:i+1000]]})
    print(f"uploaded {len(todo)}, removed stale {len(stale)}")
