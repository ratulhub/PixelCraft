export interface RawXmpEntry {
  tag: string;
  namespace: string;
  name: string;
  value: string;
  location: string;
}

export class RecursiveXmpParser {
  private entries: RawXmpEntry[] = [];

  parse(xmpStringOrBytes: string | Uint8Array, locationPrefix = 'XMP'): RawXmpEntry[] {
    this.entries = [];

    let xmlText = '';
    if (xmpStringOrBytes instanceof Uint8Array) {
      xmlText = new TextDecoder('utf-8', { fatal: false }).decode(xmpStringOrBytes);
    } else {
      xmlText = xmpStringOrBytes;
    }

    // Clean up xpacket wrappers
    const startIdx = xmlText.indexOf('<x:xmpmeta');
    const altStart = xmlText.indexOf('<rdf:RDF');
    const packetStart = startIdx !== -1 ? startIdx : altStart !== -1 ? altStart : 0;
    const cleanXml = xmlText.substring(packetStart);

    try {
      this.extractTagsWithRegex(cleanXml, locationPrefix);
    } catch (err) {
      console.warn('[XMP Parser] XML inspection warning:', err);
    }

    return this.entries;
  }

  private extractTagsWithRegex(xml: string, prefix: string): void {
    // 1. Tag with inline text or nested list items: <ns:tag>value</ns:tag> or <ns:tag><rdf:li>value</rdf:li></ns:tag>
    const tagRegex = /<([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)([^>]*)>([\s\S]*?)<\/\1:\2>/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(xml)) !== null) {
      const ns = match[1];
      const tag = match[2];
      const attrs = match[3];
      const content = match[4].trim();

      // Skip structural RDF containers
      if (ns === 'rdf' && (tag === 'RDF' || tag === 'Description' || tag === 'Seq' || tag === 'Bag' || tag === 'Alt')) {
        continue;
      }
      if (ns === 'x' && tag === 'xmpmeta') continue;

      // Extract list items if present
      if (content.includes('<rdf:li')) {
        const liRegex = /<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/g;
        let liMatch: RegExpExecArray | null;
        const items: string[] = [];
        while ((liMatch = liRegex.exec(content)) !== null) {
          const val = this.cleanXmlValue(liMatch[1]);
          if (val) items.push(val);
        }
        if (items.length > 0) {
          this.entries.push({
            tag: `${ns}:${tag}`,
            namespace: ns,
            name: this.humanizeTag(tag),
            value: items.join(', '),
            location: `${prefix}/${ns}:${tag}`,
          });
        }
      } else if (!content.startsWith('<')) {
        // Direct scalar content
        const cleanVal = this.cleanXmlValue(content);
        if (cleanVal) {
          this.entries.push({
            tag: `${ns}:${tag}`,
            namespace: ns,
            name: this.humanizeTag(tag),
            value: cleanVal,
            location: `${prefix}/${ns}:${tag}`,
          });
        }
      }

      // Also check attributes on the tag (e.g. <xmp:CreatorTool="..." />)
      this.extractAttributes(attrs, prefix);
    }

    // 2. Self-closing rdf:Description with attributes
    const descRegex = /<rdf:Description\s+([^>]+?)\/?>/g;
    while ((match = descRegex.exec(xml)) !== null) {
      this.extractAttributes(match[1], prefix);
    }
  }

  private extractAttributes(attrBlock: string, prefix: string): void {
    if (!attrBlock) return;
    const attrRegex = /([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)=["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(attrBlock)) !== null) {
      const ns = match[1];
      const tag = match[2];
      const val = this.cleanXmlValue(match[3]);

      if (ns === 'xmlns' || ns === 'xml' || tag === 'about') continue;

      if (val) {
        this.entries.push({
          tag: `${ns}:${tag}`,
          namespace: ns,
          name: this.humanizeTag(tag),
          value: val,
          location: `${prefix}/${ns}:${tag}`,
        });
      }
    }
  }

  private cleanXmlValue(val: string): string {
    return val
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
  }

  private humanizeTag(tag: string): string {
    return tag
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }
}

