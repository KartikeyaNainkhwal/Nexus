// ── Currency support for multi-currency invoicing & expenses ──

export interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
    locale: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
    INR: { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
    USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
    EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
    GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
    AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
    CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
    SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
    AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
    JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

// Approximate exchange rates relative to USD (for display/estimation only)
const RATES_TO_USD: Record<string, number> = {
    USD: 1,
    INR: 0.012,
    EUR: 1.08,
    GBP: 1.27,
    AUD: 0.65,
    CAD: 0.74,
    SGD: 0.75,
    AED: 0.27,
    JPY: 0.0067,
};

/**
 * Format an amount in the given currency
 * e.g. formatCurrency(1500, "INR") → "₹1,500.00"
 */
export function formatCurrency(amount: number, currencyCode: string = "INR"): string {
    const info = CURRENCIES[currencyCode];
    if (!info) return `${currencyCode} ${amount.toFixed(2)}`;

    try {
        return new Intl.NumberFormat(info.locale, {
            style: "currency",
            currency: info.code,
            minimumFractionDigits: info.code === "JPY" ? 0 : 2,
            maximumFractionDigits: info.code === "JPY" ? 0 : 2,
        }).format(amount);
    } catch {
        return `${info.symbol}${amount.toFixed(2)}`;
    }
}

/**
 * Approximate currency conversion (for display only — NOT for billing)
 */
export function convertCurrency(amount: number, from: string, to: string): number {
    if (from === to) return amount;
    const fromRate = RATES_TO_USD[from] ?? 1;
    const toRate = RATES_TO_USD[to] ?? 1;
    return (amount * fromRate) / toRate;
}

/**
 * Get the symbol for a currency code
 */
export function getCurrencySymbol(code: string): string {
    return CURRENCIES[code]?.symbol ?? code;
}

/**
 * Generate next invoice number: INV-0001, INV-0002, etc.
 */
export function generateInvoiceNumber(lastNumber: string | null): string {
    if (!lastNumber) return "INV-0001";
    const match = lastNumber.match(/INV-(\d+)/);
    if (!match) return "INV-0001";
    const next = parseInt(match[1], 10) + 1;
    return `INV-${String(next).padStart(4, "0")}`;
}
