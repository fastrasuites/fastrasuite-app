export interface CurrencyOption {
  country: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

export const GLOBAL_CURRENCIES: CurrencyOption[] = [
  { country: "United States", currencyCode: "USD", currencyName: "US Dollar", currencySymbol: "$" },
  { country: "European Union", currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
  { country: "United Kingdom", currencyCode: "GBP", currencyName: "British Pound", currencySymbol: "£" },
  { country: "Japan", currencyCode: "JPY", currencyName: "Japanese Yen", currencySymbol: "¥" },
  { country: "Nigeria", currencyCode: "NGN", currencyName: "Nigerian Naira", currencySymbol: "₦" },
  { country: "Canada", currencyCode: "CAD", currencyName: "Canadian Dollar", currencySymbol: "CA$" },
  { country: "Australia", currencyCode: "AUD", currencyName: "Australian Dollar", currencySymbol: "A$" },
  { country: "Switzerland", currencyCode: "CHF", currencyName: "Swiss Franc", currencySymbol: "CHF" },
  { country: "China", currencyCode: "CNY", currencyName: "Chinese Yuan", currencySymbol: "CN¥" },
  { country: "India", currencyCode: "INR", currencyName: "Indian Rupee", currencySymbol: "₹" },
  { country: "Brazil", currencyCode: "BRL", currencyName: "Brazilian Real", currencySymbol: "R$" },
  { country: "South Africa", currencyCode: "ZAR", currencyName: "South African Rand", currencySymbol: "R" },
  { country: "Mexico", currencyCode: "MXN", currencyName: "Mexican Peso", currencySymbol: "MX$" },
  { country: "Singapore", currencyCode: "SGD", currencyName: "Singapore Dollar", currencySymbol: "S$" },
  { country: "New Zealand", currencyCode: "NZD", currencyName: "New Zealand Dollar", currencySymbol: "NZ$" },
  { country: "United Arab Emirates", currencyCode: "AED", currencyName: "UAE Dirham", currencySymbol: "د.إ" },
  { country: "Saudi Arabia", currencyCode: "SAR", currencyName: "Saudi Riyal", currencySymbol: "﷼" },
  { country: "South Korea", currencyCode: "KRW", currencyName: "South Korean Won", currencySymbol: "₩" },
  { country: "Sweden", currencyCode: "SEK", currencyName: "Swedish Krona", currencySymbol: "kr" },
  { country: "Norway", currencyCode: "NOK", currencyName: "Norwegian Krone", currencySymbol: "kr" },
  { country: "Denmark", currencyCode: "DKK", currencyName: "Danish Krone", currencySymbol: "kr" },
  { country: "Russia", currencyCode: "RUB", currencyName: "Russian Ruble", currencySymbol: "₽" },
  { country: "Turkey", currencyCode: "TRY", currencyName: "Turkish Lira", currencySymbol: "₺" },
  { country: "Kenya", currencyCode: "KES", currencyName: "Kenyan Shilling", currencySymbol: "KSh" },
  { country: "Ghana", currencyCode: "GHS", currencyName: "Ghanaian Cedi", currencySymbol: "GH₵" },
  { country: "Egypt", currencyCode: "EGP", currencyName: "Egyptian Pound", currencySymbol: "E£" },
  { country: "Israel", currencyCode: "ILS", currencyName: "Israeli New Shekel", currencySymbol: "₪" },
  { country: "Philippines", currencyCode: "PHP", currencyName: "Philippine Peso", currencySymbol: "₱" },
  { country: "Indonesia", currencyCode: "IDR", currencyName: "Indonesian Rupiah", currencySymbol: "Rp" },
  { country: "Malaysia", currencyCode: "MYR", currencyName: "Malaysian Ringgit", currencySymbol: "RM" },
  { country: "Thailand", currencyCode: "THB", currencyName: "Thai Baht", currencySymbol: "฿" },
  { country: "Vietnam", currencyCode: "VND", currencyName: "Vietnamese Dong", currencySymbol: "₫" },
  { country: "Argentina", currencyCode: "ARS", currencyName: "Argentine Peso", currencySymbol: "AR$" },
  { country: "Colombia", currencyCode: "COP", currencyName: "Colombian Peso", currencySymbol: "CO$" },
  { country: "Chile", currencyCode: "CLP", currencyName: "Chilean Peso", currencySymbol: "CL$" },
  { country: "Peru", currencyCode: "PEN", currencyName: "Peruvian Sol", currencySymbol: "S/" }
].sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
