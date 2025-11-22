import random
import string

def generate_random_string(length=35):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

num_inserts = 500

with open("init.sql", "a") as f:
    for _ in range(num_inserts):
        random_value = generate_random_string()
        f.write(f"INSERT INTO flags (value) VALUES ('{random_value}');\n")