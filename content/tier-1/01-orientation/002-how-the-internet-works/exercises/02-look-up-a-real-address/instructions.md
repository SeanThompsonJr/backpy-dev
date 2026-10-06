## The situation

PokeTeam gets its Pokémon data from PokeAPI at `pokeapi.co`.
Before your code can ask it anything, DNS and TLS have to do their jobs.
Here you watch both happen for real.

## Your task

1. Open **Windows Terminal**.
2. Type `nslookup pokeapi.co` and press Enter.
3. Under `Name: pokeapi.co`, find the addresses DNS gave back.
4. In Chrome, go to `https://pokeapi.co`.
5. Click the icon at the left of the address bar.
6. Click **Connection is secure**, then **Certificate is valid**.
   (Edge has similar steps.)
7. In the certificate, find **Issued By**.
8. Tick each item in the checklist when it's true.

## Example

Your addresses and DNS server will differ. The shape looks like this:

```text
Server:  your-providers-dns.example
Address:  203.0.113.1

Non-authoritative answer:
Name:    pokeapi.co
Addresses:  2001:db8::10
          203.0.113.10
```

- `Server:` is your DNS resolver. It may say `UnKnown` or show your
  router's address. That's normal.
- "Non-authoritative" means your resolver answered, often from memory,
  not the name servers in charge of pokeapi.co.
- **Issued By** may show a short code, plus the organization behind it.
