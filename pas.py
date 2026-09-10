import bcrypt
hash = bcrypt.hashpw('Admin@itp'.encode('utf-8'), bcrypt.gensalt())
print(hash.decode())