# EmoLink

A backendless emoji-based URL shortener for the Edge.

https://emol.ink/😻👩🏿‍🤝‍👨🏾👃🏾🛴👩🏾‍🎨🏍️🤷🏻‍♀🧑🏻‍🎨🧹🚚✋🏽

## FAQ

#### Does this work?

Yeah, it does. But I think what you mean to ask is, "How does this work."

#### How does this work?

Okay, so a few things are going on here:

1. **Emoji in a URL**
   In 2005, the IETF decided that some fraction of the Internet may be interested in non-US-ASCII characters in their URIs. To do this, they created [Internationalized Resource Identifier (IRI)](https://www.ietf.org/rfc/rfc3987.txt), a protocol that extends the functionality of the Uniform Resource Identifier (URI) to include Unicode characters. To maintain backward compatibility with existing URI infrastructure, IRIs can be mapped to URIs using percent-encoded ASCII values. So, basically, just `encodeURIComponent`, and you're good.

   Here's the trick: Modern web browsers support IRIs by _displaying_ them in their native character sets, but converting them to URI before sending requests through the backend infrastructure that may not support it. So, while the URI may be long and ugly, all people will see is the IRI.

2. **Generating Collision-Free IDs Offline**
   There are a few standard answers to this question, but none is capable of running on [David Howell Evans](https://en.wikipedia.org/wiki/The_Edge).

   - A central, consistent, ID generator - Typically, this just means using an RDBMS' auto-incremented primary ID. This works, but a centralized ID generator can become a bottleneck when the system needs to scale horizontally, is a single point of failure, limits your DB choices, and is often incompatible with computing at the Edge - particularly if the Edge extends past CDNs onto devices.
   - A coordination service to distribute ranges of IDs to persistent stateful servers - This is your typical systems-design answer because it's maximally scalable and fault tolerant. But it's also stateful, serverfull, pretty complex to implement, and can lead to weird ID fragmentation in your DB.
   - A random ID + collision validation - There are as many ways to do this as there are bugs in my code, but they all share the same weakness: the shorter they are, the more collisions you'll have, which is not a great tradeoff to have to make when the goal of a URL shortener is to produce the shortest possible ID.

   But check your priors! All of these solutions are workarounds that start with the assumption of a 62-char (`[A-Za-z0-9]`) alphabet, which makes a 32-char UUID too long for a service called a "shortener." BUT(!), by expanding the alphabet (your base) from 62 ASCII characters to 4,500 emojis, you can encode a UUID in just 11 characters

   With the larger alphabet, you get distributed, offline-capable, fault-tolerant, collision-free ID creation without any of the drawbacks of the other approaches. The price is four characters. A typical shortener is 7 chars, and this needs 11.

3. **Base N Encoding**
   1. Convert UUID to a 128-bit binary number
   2. Determine the number of bits (N) required to encode the alphabet by finding the largest number of bits that is less than the size of our alphabet. For this project, that's 12 since 2^12 < ~4500 < 2^13.
   3. Group the UUID's into N-bit chunks.
   4. For each N-bit grouping: `emojis[parseInt(binaryNumber, 2)]`

#### Why would I do this?

Well, one answer might be "[because I can](https://en.wikipedia.org/wiki/George_Mallory#:~:text=Mallory%20is%20famously%20quoted%20as,famous%20three%20words%20in%20mountaineering%22.)". A better answer is that this is pretty novel and actually has a few actual advantages:

1. It's backendless, which lets you run this on devices at the Edge, which may have limited, or intermittent connectivity.
2. It's simple and dependency-free. The only servers that don't break in production are servers that don't exist.
3. It does not constrain or require any specific tools or architecture. For example, ID generation requires specific types of DBs and distributed hashing requires load balancing, health checking, and a coordination service.
4. Your address space is unlimited. The standard approach to the problem uses an address space that is 7^62. This is very large, but because it's finite, you'll need to protect against bad actors filling up the space. This is typically done with an auth layer, but this isn't an issue when your address space is infinite-ish.
5. IRIs are insufferably modern. So, if you use SvelteKit, wear a [teenie weenie beanie](https://youtu.be/9r5XVdKKcas), and don't think of the beach when you see a cartoon crab; you should probably be using IRIs.
6. Emoji is better than ASCII.
