# Rotate Auth Key

This is a script to help rotate an account's auth key.

## Usage

Create an `.env` file by coping `.env-example`, fill addresses and private keys of `for account` and `to account`, and then

```sh
yarn start
```

Upon success, a new rotated account will be created with `for account`'s address `to account`'s private key.