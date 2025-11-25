#!/usr/bin/env python3
import base64

flag = "PTA{b4s3_64_1s_n0t_3ncrypt10n}"
encoded = base64.b64encode(flag.encode()).decode()

print(f"Encoded: {encoded}")
with open("output.txt", "w") as f:
    f.write(encoded)
