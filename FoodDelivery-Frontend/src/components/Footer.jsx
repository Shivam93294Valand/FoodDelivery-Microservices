import { Facebook, Twitter, Instagram } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-black/5 bg-white/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold">Food Delivery</h3>
            <p className="text-sm text-black/60 mt-2">Fast delivery, fresh meals. © {new Date().getFullYear()}</p>
          </div>

          <div className="flex gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Company</h4>
              <ul className="text-sm text-black/60 space-y-1">
                <li><a href="#" className="hover:text-black">About</a></li>
                <li><a href="#" className="hover:text-black">Careers</a></li>
                <li><a href="#" className="hover:text-black">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Support</h4>
              <ul className="text-sm text-black/60 space-y-1">
                <li><a href="#" className="hover:text-black">Help Center</a></li>
                <li><a href="#" className="hover:text-black">Terms</a></li>
                <li><a href="#" className="hover:text-black">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3 text-black/60">
              <a href="#" className="p-2 rounded-full hover:bg-black/5"><Facebook className="size-4" /></a>
              <a href="#" className="p-2 rounded-full hover:bg-black/5"><Twitter className="size-4" /></a>
              <a href="#" className="p-2 rounded-full hover:bg-black/5"><Instagram className="size-4" /></a>
            </div>
            <form className="flex items-center gap-2 mt-2" onSubmit={(e)=>e.preventDefault()}>
              <input type="email" placeholder="Your email" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <button className="px-4 py-2 bg-black text-white rounded-xl text-sm">Subscribe</button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer