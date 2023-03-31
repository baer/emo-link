# EmoShort

A very silly collision-free, emoji-based URL shortener built for David Howell Evans

## FAQ

#### Does this work?

Yeah, it does. But I think what you mean to ask is, "how does this work."

#### How does this work?

Okay, so a few things are going on here:

1. **Emoji in a URL**
   In 2005, the IETF decided that some people would like non-US-ASCII characters in their URIs. To do this, they created [IRI](Internationalized Resource Identifier), which includes all Unicode characters. To order to maintain backward compatibility, any IRI can be mapped to a URI with Percent Encoded ASCII values. So, basically, just `encodeURIComponent`, and you're good.

   Here's the trick: modern browsers display an encoded URL as an IRI! So, while the URL may be long and ugly, all most people will see is the fun string of Emoji.

2. **Generating Unique IDs**
   The standard answer is one of the following three things:

   - A central, consistent ID generator like an RDBMS' auto-incremented primary ID
   - A coordination service to distribute ranges of IDs to always-on servers
   - A random ID + validation to prevent collision

   But you can do better. Typically, nobody uses a UUID because they are too long. A UUID string is 32 hexadecimal chars. You can base62 encode it, which is URL-safe, but that only brings it down to 22. BUT(!), if you increase the alphabet from 62 ASCII chars to all 4500 emojis, you only need 11!

3. **Base N Encoding**
   1. Convert UUID to bin
   2. Group by M bits, where M is enough to encode N values. It's 12.
   3. For each 12-bit grouping: `Emojis[parseInt(binaryNumber, 2)]`

#### Why would I do this?

Well, one answer might be that an interviewer asked how you could write a collision-free, client-side-only, central-databaseless URL shortener. A better answer is that it can be run at the edge, or even in the client, without any centralized service, distributed consensus, or specific DB capability. Also, because Emoji is just better than ASCII.
