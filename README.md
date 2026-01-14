# rumsan-kb-admin

Generate base64 string using the following command

```sh
sed -n '/-----BEGIN PUBLIC KEY-----/,/-----END PUBLIC KEY-----/p' your-public-key.pem | sed -e '1d;$d' | tr -d '\n'
```
