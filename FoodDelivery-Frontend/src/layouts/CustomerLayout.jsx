import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const CustomerLayout = () => {
    return (
        <div className="min-h-dvh bg-slate-50/50 flex flex-col">
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default CustomerLayout