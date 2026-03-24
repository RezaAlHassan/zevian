export function detectIntegrityFlags(reportText: string): string[] {
    const flags: string[] = [];
    if (!reportText) return flags;

    const lowerText = reportText.toLowerCase();

    // Check for common evasion or templated text
    if (lowerText.includes('ignore all previous instructions')) {
        flags.push('Prompt injection attempt detected');
    }

    if (lowerText.includes('lorem ipsum')) {
        flags.push('Placeholder text detected');
    }

    if (lowerText.length < 50) {
        flags.push('Report is suspiciously short');
    }

    // Check for excessive repetition (e.g. "test test test test")
    const words = lowerText.split(/\s+/);
    if (words.length > 10) {
        const uniqueWords = new Set(words);
        if (uniqueWords.size / words.length < 0.2) {
            flags.push('Highly repetitive text detected');
        }
    }

    return flags;
}
