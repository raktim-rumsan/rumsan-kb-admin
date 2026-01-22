# rumsan-kb-admin

- Copy the env.example to create .env

```sh
cp env.example .env
```

- Generate base64 string of your public key file using the following command

```sh
sed -n '/-----BEGIN PUBLIC KEY-----/,/-----END PUBLIC KEY-----/p' your-public-key.pem | sed -e '1d;$d' | tr -d '\n'
```

- Copy everything except % at the end.

- Use the base64 string in the `NEXT_PUBLIC_ENCRYPT_KEY`
