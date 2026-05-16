export const HTTP_URL="http://localhost:4000"

type NavItemsProps = {
  href: string;
  label: string
}

export const navItems: NavItemsProps[] = [
  {
    href: "/trade/INR-AXIS",
    label: "trade"
  },
  {
    href: "/wallet",
    label: "wallet"
  }
];

type ShowcaseScreenProps = {
  content: string
}

export const showcaseScreen1: ShowcaseScreenProps[] = [
  {
    content: "10+ networks. One unified wallet",
  },
  {
    content: "Zero-fee swaps and bridging across networks",
  },
  {
    content: "Manage crypto, DeFi positions, and NFTs in one place",
  },
  {
    content: "Explore and access dApps natively",
  },
  {
    content: "Move assets instantly between wallet and exchange",
  },
]