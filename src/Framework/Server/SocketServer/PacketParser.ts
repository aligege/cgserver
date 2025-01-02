export class PacketParser {
    private buffer: Buffer
    private offset: number
    
    constructor() {
        this.buffer = Buffer.alloc(0)
        this.offset = 0
    }

    push(chunk: Buffer) {
        const newBuffer = Buffer.alloc(this.buffer.length + chunk.length)
        this.buffer.copy(newBuffer, 0)
        chunk.copy(newBuffer, this.buffer.length)
        this.buffer = newBuffer
    }

    parse(): Buffer | null {
        if (this.buffer.length < 4) return null

        // Read packet length (first 4 bytes)
        const length = this.buffer.readUInt32BE(0)
        
        if (this.buffer.length < length + 4) return null

        // Extract packet
        const packet = this.buffer.slice(4, length + 4)
        
        // Remove parsed data from buffer
        this.buffer = this.buffer.slice(length + 4)
        
        return packet
    }

    pack(data: Buffer): Buffer {
        const length = data.length
        const packet = Buffer.alloc(length + 4)
        
        // Write length header
        packet.writeUInt32BE(length, 0)
        
        // Write data
        data.copy(packet, 4)
        
        return packet
    }
} 