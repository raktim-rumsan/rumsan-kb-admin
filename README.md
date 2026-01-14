# rumsan-kb-admin

Generate base64 string of your public key file using the following command

```sh
sed -n '/-----BEGIN PUBLIC KEY-----/,/-----END PUBLIC KEY-----/p' your-public-key.pem | sed -e '1d;$d' | tr -d '\n'
```
