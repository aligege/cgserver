export class PacketParser {
    protected buffer: Buffer

    constructor() {
        this.buffer = Buffer.alloc(0)
    }

    push(chunk: Buffer) {
        // Use Buffer.concat which is concise and optimized internally
        this.buffer = Buffer.concat([this.buffer, chunk], this.buffer.length + chunk.length)
    }

    parse(): Buffer | null {
        // Need at least 4 bytes for length header
        if (this.buffer.length < 4) return null

        // Read packet length (first 4 bytes)
        const length = this.buffer.readUInt32BE(0)

        // Not enough data yet
        if (this.buffer.length < length + 4) return null

        const start = 4
        const end = 4 + length

        // Copy packet out so callers don't keep a view into the large backing buffer
        const packet = Buffer.from(this.buffer.slice(start, end))

        // Remove parsed data from buffer. We try to avoid keeping a large backing
        // buffer alive by compacting the remainder when it's small relative to the
        // previous buffer.
        const remainderLen = this.buffer.length - end
        if (remainderLen <= 0) {
            this.buffer = Buffer.alloc(0)
        } else {
            const remainder = this.buffer.slice(end)
            // If remainder is much smaller than the previous buffer, copy it to
            // release the old backing store. Otherwise keep the slice to avoid
            // an extra copy.
            if (remainderLen < (this.buffer.length >> 1)) {
                this.buffer = Buffer.from(remainder)
            } else {
                this.buffer = remainder
            }
        }

        return packet
    }

    pack(data: Buffer): Buffer {
        const length = data.length
        // allocUnsafe for slight perf improvement; we write every byte below
        const packet = Buffer.allocUnsafe(length + 4)

        // Write length header
        packet.writeUInt32BE(length, 0)

        // Write data
        data.copy(packet, 4)

        return packet
    }
} 