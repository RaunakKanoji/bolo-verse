"""Generate the original, tiny USDZ used by the app-hosted RealityKit tests."""
from pathlib import Path
import struct
import zipfile

stage = b'''#usda 1.0
(
    defaultPrim = "FixtureProduct"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "FixtureProduct"
{
    def Mesh "OffsetBox"
    {
        double3 xformOp:translate = (0.25, 0.5, -0.125)
        uniform token[] xformOpOrder = ["xformOp:translate"]
        point3f[] points = [(-0.1, -0.2, -0.05), (0.1, -0.2, -0.05), (0.1, 0.2, -0.05), (-0.1, 0.2, -0.05), (-0.1, -0.2, 0.05), (0.1, -0.2, 0.05), (0.1, 0.2, 0.05), (-0.1, 0.2, 0.05)]
        int[] faceVertexCounts = [4, 4, 4, 4, 4, 4]
        int[] faceVertexIndices = [0, 3, 2, 1, 4, 5, 6, 7, 0, 1, 5, 4, 3, 7, 6, 2, 0, 4, 7, 3, 1, 2, 6, 5]
        uniform token subdivisionScheme = "none"
        color3f[] primvars:displayColor = [(0.65, 0.55, 0.85)]
        float3[] extent = [(-0.1, -0.2, -0.05), (0.1, 0.2, 0.05)]
    }
}
'''

destination = Path(__file__).with_name("bounded-product.usdz")
entry = zipfile.ZipInfo("bounded-product.usda", date_time=(2026, 1, 1, 0, 0, 0))
entry.compress_type = zipfile.ZIP_STORED
entry.external_attr = 0o100644 << 16
# USDZ requires every file payload to begin on a 64-byte boundary.
padding = (-(30 + len(entry.filename.encode("utf-8")) + 4)) % 64
entry.extra = struct.pack("<HH", 0x1986, padding) + bytes(padding)
with zipfile.ZipFile(destination, "w", allowZip64=False) as archive:
    archive.writestr(entry, stage)
with zipfile.ZipFile(destination) as archive:
    stored = archive.infolist()[0]
    payload_offset = stored.header_offset + 30 + len(stored.filename.encode("utf-8")) + len(stored.extra)
    assert payload_offset % 64 == 0
    assert stored.compress_type == zipfile.ZIP_STORED
    assert archive.testzip() is None
print(f"{destination.name}: {destination.stat().st_size} bytes, payload offset {payload_offset}")
