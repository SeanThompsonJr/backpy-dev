---
id: 2
title: "How the internet works: DNS, TCP/IP, TLS, the request journey"
section: Orientation
sources: ["BOS 2"]
concepts_introduced: [ip-address, dns, tcp, tls, https]
concepts_used: [ip-address, dns, tcp, tls, https, backend, python-function, python-dict, python-string-methods, python-if, python-list]
explain_back: "You type pokeapi.co and press Enter. What happens before the browser can ask for the page?"
unverified_claims: []
---
## Why this matters

Before your backend sees a single request, three things have already happened: a DNS lookup,
a TCP connection and a TLS handshake. You don't write that code, but you depend on it every
day. When you deploy PokeTeam (put it on a server the world can reach), you'll point a domain
name like `pokeapi.co` at that server and turn on HTTPS. And when a site is down, the first
question is: which step failed?

## The concept

You type `pokeapi.co` and press Enter. Here are the first steps of the request journey.
(Lesson 4 follows it all the way to the database and back.)

### 1. DNS: find the address

Computers find each other by **IP address**, not by name. An IPv4 address is four numbers from
0 to 255, like `203.0.113.10`. Newer IPv6 addresses are longer, like `2001:db8::10`.

**DNS** (the Domain Name System) turns a name into an IP address:

1. Your computer asks a **DNS resolver**, a server whose job is answering "what's the address
   for this name?" It's often run by your internet provider.
2. If the resolver doesn't know yet, it finds and asks the name servers in charge of that name.
3. It sends the address back. The resolver, your computer and your browser each remember it for
   a while (they cache it), so repeat visits often skip some or all of the lookup.

> Restaurant: you know the restaurant's name, so you look up its street address.

### Check yourself

- [What does DNS give back when you ask about `pokeapi.co`?](#1-dns-find-the-address)
- [Why do repeat visits often skip the DNS lookup?](#1-dns-find-the-address)

### 2. TCP: open a reliable conversation

Data travels in small chunks called packets. **IP** moves packets from one address to another,
but some get lost or arrive out of order. **TCP** runs on top of IP and fixes that: it numbers
the data, re-sends what's missing, and puts it back in order. Before any data moves, TCP does a
three-step handshake:

1. Browser: "Can we talk?"
2. Server: "Yes. Can you hear me?"
3. Browser: "Yes."

> Restaurant: the greeting at the door. You: "Table for one?" Staff: "Yes, we have one.
> Ready?" You: "Ready." Nobody takes your order before you're seated.

### Check yourself

- [What does TCP add on top of IP?](#2-tcp-open-a-reliable-conversation)

### 3. TLS: privacy and proof

**HTTP** is the set of rules a browser and a server use to ask for something and answer it.
Lesson 3 shows what it looks like. On its own, it's sent as plain text. **TLS** adds two things:

1. **Proof of identity.** The server shows a certificate saying "this really is pokeapi.co".
   It's signed by a **certificate authority**, an organization that checks the site really
   controls that name before it signs. The browser checks that the signature leads back to an
   authority it trusts, and that the name and dates are right.
2. **Privacy.** The two sides agree on a secret only they know, and use it to encrypt
   (scramble) everything after that. People in between can still see which site you're
   visiting, but not what you send or get back.

**HTTPS** is HTTP sent through TLS. An address starting `https://` means the connection is
private and the server proved who it is. Plain `http://` has neither.

A certificate proves you reached the name in the address bar, not that the site is honest. A
look-alike site can have a valid certificate for its own look-alike name.

> Restaurant: a private booth, so nobody overhears your order, plus the licence on the wall
> proving it's the real restaurant. HTTPS is placing your order from that booth.

### Check yourself

- [Name the two things TLS gives you.](#3-tls-privacy-and-proof)
- [Does a valid certificate prove a site is honest?](#3-tls-privacy-and-proof)

### 4. The request

Only now does the browser ask for what it wants, and the response comes back over the same
private connection.

Many sites, pokeapi.co included, also support **HTTP/3**, which swaps TCP for a newer road
called QUIC. QUIC sets up the connection and TLS together, so it starts faster. Same journey,
different road.

Where the restaurant stops matching:

- A big site often has several addresses, and different users can be sent to different ones.
- Real networks do lose packets, and TCP quietly re-sends them. A greeting at the door never
  loses words.
- Anyone can photocopy a licence. A certificate can be copied too, but only the real server
  holds the private key that matches it, and TLS makes the server prove it has it.

## Worked example

A URL (a full web address) holds the parts the journey uses. The scheme says whether TLS is on,
the host is the name DNS looks up, and the path is what the request asks for:

```python run
url = "https://pokeapi.co/api/v2/pokemon/pikachu"

scheme, rest = url.split("://")
host = rest.split("/")[0]
path = rest[len(host):]

print(scheme)
print(host)
print(path)
```

A Python dict works like your phone's contacts (look up a name, get a number), so it can play a
tiny, made-up DNS. (Addresses starting `203.0.113.` are reserved for examples.)

```python run
DNS = {
    "pokeapi.co": "203.0.113.10",
    "poketeam.example": "203.0.113.25",
}

def look_up(name):
    return DNS.get(name, "could not resolve host")

print(look_up("pokeapi.co"))
print(look_up("pokeapi.cm"))
```

In this made-up DNS, a one-letter typo means no address, and the journey stops at step 1.

## What breaks

Each step can fail on its own, and knowing which one failed tells you where to look:

1. **DNS:** the name doesn't exist, so the browser shows an error instead of the page. A typo
   can also land you on someone else's site, because many look-alike names are registered.
2. **TCP:** nothing is listening at that address, or a **firewall** (a filter that blocks some
   connections) stops it. The connection is refused, or it waits until it gives up.
3. **TLS:** the certificate expired, or it's for a different name. The browser shows a
   full-page warning that the connection isn't private.
4. **No TLS at all:** plain `http://` still works, which is the danger. On shared Wi-Fi, someone
   may be able to see and change what you send, passwords included. Browsers increasingly warn
   before opening a plain `http://` site, but people click past warnings, and code that calls a
   server never sees one.

Ask of anything sent to your server: **Who can send this, and what's the worst thing they could
send?** On the network, add: who can read it on the way? Without HTTPS, possibly anyone in
between.

## Check yourself

- [Put these in order: TLS handshake, DNS lookup, request, TCP connection.](#the-concept)
- [On shared Wi-Fi with HTTPS, what can others see, and what can't they?](#3-tls-privacy-and-proof)
- [A site shows a full-page warning that the connection isn't private. Which step failed?](#what-breaks)
- [Why is plain `http://` dangerous even though the page works?](#what-breaks)
