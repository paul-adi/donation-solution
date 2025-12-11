import Link from "next/link"
import Image from "next/image"
import WalletButton from "./WalletButton";


function Header() {
  return (
        <header className="fixed-header">
          <nav style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div className="logo"><Link href="/"><Image src="/usdcseed.png" width={40} height={20} alt="SEED"/></Link></div>
            <div className="nav-links">
                <Link href="/about" className="create-campaign-btn">
                About
                </Link>
                <Link href="/create-campaign" className="create-campaign-btn">
                Create Campaign
                </Link>
                <Link href="/withdrawal" className="create-campaign-btn">
                Withdrawal
                </Link>
            </div>
             <div className="nav-donate-links">
                <Link href="/donate" className="create-campaign-btn">
                DONATE
                </Link>
            </div>
           </nav>
           <WalletButton />
        </header>
  )
}

export default Header