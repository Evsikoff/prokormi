"""Derive a blanket-free telescope car without altering the supplied GLB.

The source is a single glTF mesh, so the raised roof pad cannot be hidden by
node name. This script welds coincident positions only for connectivity
analysis, then removes the distinct raised pad's triangles from the index
accessor. Vertices, attributes, materials and embedded textures stay intact.
"""

from __future__ import annotations

import json
import struct
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/models/telescope_final/yellow-car.glb"
DESTINATION = ROOT / "public/models/telescope_final/yellow-car-no-blanket.glb"
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


def read_glb(path: Path):
    data = path.read_bytes()
    magic, version, declared_length = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or declared_length != len(data):
        raise ValueError(f"Invalid GLB header: {path}")
    offset = 12
    chunks = []
    while offset < len(data):
        length, kind = struct.unpack_from("<II", data, offset)
        offset += 8
        chunks.append((kind, data[offset : offset + length]))
        offset += length
    if len(chunks) != 2 or chunks[0][0] != JSON_CHUNK or chunks[1][0] != BIN_CHUNK:
        raise ValueError("Expected one JSON and one BIN chunk")
    return json.loads(chunks[0][1]), bytearray(chunks[1][1])


def read_accessor(document, binary, accessor_id, format_char, dimensions):
    accessor = document["accessors"][accessor_id]
    view = document["bufferViews"][accessor["bufferView"]]
    fmt = "<" + format_char * dimensions
    element_size = struct.calcsize(fmt)
    stride = view.get("byteStride", element_size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def pad_chunk(data: bytes, pad_byte: bytes) -> bytes:
    return data + pad_byte * ((-len(data)) % 4)


def write_glb(path: Path, document, binary: bytes):
    json_bytes = pad_chunk(json.dumps(document, separators=(",", ":")).encode(), b" ")
    bin_bytes = pad_chunk(binary, b"\0")
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    path.write_bytes(
        struct.pack("<4sII", b"glTF", 2, total)
        + struct.pack("<II", len(json_bytes), JSON_CHUNK)
        + json_bytes
        + struct.pack("<II", len(bin_bytes), BIN_CHUNK)
        + bin_bytes
    )


def main():
    document, binary = read_glb(SOURCE)
    primitive = document["meshes"][0]["primitives"][0]
    positions = read_accessor(document, binary, primitive["attributes"]["POSITION"], "f", 3)
    index_id = primitive["indices"]
    index_accessor = document["accessors"][index_id]
    if index_accessor["componentType"] != 5123:
        raise ValueError("Expected unsigned 16-bit triangle indices")
    indices = [item[0] for item in read_accessor(document, binary, index_id, "H", 1)]
    if len(indices) % 3:
        raise ValueError("Index count is not a multiple of three")

    parent = list(range(len(positions)))

    def find(vertex):
        while parent[vertex] != vertex:
            parent[vertex] = parent[parent[vertex]]
            vertex = parent[vertex]
        return vertex

    def union(first, second):
        first, second = find(first), find(second)
        if first != second:
            parent[second] = first

    # The exported mesh duplicates vertices across UV seams. Weld by position
    # for connected-component detection, without changing the actual geometry.
    positions_by_key = {}
    for vertex, position in enumerate(positions):
        key = tuple(round(coordinate, 6) for coordinate in position)
        if key in positions_by_key:
            union(vertex, positions_by_key[key])
        else:
            positions_by_key[key] = vertex
    for first, second, third in zip(indices[0::3], indices[1::3], indices[2::3]):
        union(first, second)
        union(second, third)

    components = defaultdict(lambda: {"triangles": 0, "vertices": set()})
    triangles = list(zip(indices[0::3], indices[1::3], indices[2::3]))
    for triangle in triangles:
        component = components[find(triangle[0])]
        component["triangles"] += 1
        component["vertices"].update(triangle)

    candidates = []
    for root, component in components.items():
        points = [positions[vertex] for vertex in component["vertices"]]
        low = [min(point[axis] for point in points) for axis in range(3)]
        high = [max(point[axis] for point in points) for axis in range(3)]
        if (
            100 <= component["triangles"] <= 300
            and low[1] > 0.10
            and high[1] > 0.119
            and low[0] < -0.03
            and high[0] > 0.05
            and low[2] < -0.039
            and high[2] > 0.040
        ):
            candidates.append((root, component, low, high))
    if len(candidates) != 1:
        raise ValueError(f"Expected exactly one raised roof pad; found {len(candidates)}")
    pad_root, pad, low, high = candidates[0]
    kept_indices = [
        vertex
        for triangle in triangles
        if find(triangle[0]) != pad_root
        for vertex in triangle
    ]
    if len(kept_indices) != len(indices) - pad["triangles"] * 3:
        raise AssertionError("Unexpected index count after filtering")

    view = document["bufferViews"][index_accessor["bufferView"]]
    start = view.get("byteOffset", 0) + index_accessor.get("byteOffset", 0)
    struct.pack_into("<" + "H" * len(kept_indices), binary, start, *kept_indices)
    index_accessor["count"] = len(kept_indices)
    write_glb(DESTINATION, document, binary)

    verified, verified_binary = read_glb(DESTINATION)
    verified_index = verified["accessors"][index_id]
    if verified_index["count"] != len(kept_indices):
        raise AssertionError("Derived GLB index count differs from expected")
    if len(verified_binary) != len(binary):
        raise AssertionError("Embedded binary chunk changed length")
    print(
        f"Saved {DESTINATION}; removed {pad['triangles']} triangles "
        f"({pad['triangles'] * 3} indices), pad bounds "
        f"X[{low[0]:.5f},{high[0]:.5f}] "
        f"Y[{low[1]:.5f},{high[1]:.5f}] "
        f"Z[{low[2]:.5f},{high[2]:.5f}]"
    )


if __name__ == "__main__":
    main()
