import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, UserPlus, Users, ClipboardList, QrCode, FileText, Utensils, Upload, LogOut, Menu, X } from 'lucide-react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import Loader from '../../components/Loader'

export default function AdminDashboard() {
  const { user, logout, logoutLoading } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { 
      title: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/admin' 
    },
    { 
      title: 'Add User', 
      icon: UserPlus, 
      path: '/admin/add-user' 
    },
    /*{ 
      title: 'Bulk Add User', 
      icon: Upload, 
      path: '/admin/bulk-add-user' 
    },*/
    { 
      title: 'Add Team', 
      icon: Users, 
      path: '/admin/add-team' 
    },
    { 
      title: 'View Participants', 
      icon: ClipboardList, 
      path: '/admin/participants' 
    },
    { 
      title: 'View Teams', 
      icon: Users, 
      path: '/admin/teams' 
    },
    { 
      title: 'Check In', 
      icon: QrCode, 
      path: '/admin/check-in' 
    },
    { 
        title: 'Check In QR', 
        icon: QrCode, 
        path: '/admin/check-in-qr' 
    },
    { 
      title: 'Check In Users', 
      icon: ClipboardList, 
      path: '/admin/checked-in-users' 
    },
    { 
      title: 'Not Check In Users', 
      icon: ClipboardList, 
      path: '/admin/not-checked-in-users' 
    },
    // { 
    //   title: 'Add PS', 
    //   icon: FileText, 
    //   path: '/admin/add-ps' 
    // },
    // { 
    //   title: 'Food QR', 
    //   icon: Utensils, 
    //   path: '/admin/food-qr' 
    // }
  ]

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  if (logoutLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#191E29]"><Loader /></div>
  }

  return (
    <div className="min-h-screen h-screen flex flex-col lg:flex-row bg-[#191E29]">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-20 text-white"
        onClick={toggleMobileMenu}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div className={`w-full lg:w-64 bg-[#132D46] border-b lg:border-b-0 lg:border-r border-[#01C38D]/20 overflow-y-auto ${mobileMenuOpen ? 'fixed inset-0 z-10' : 'hidden lg:block'}`}>
        <div className="p-4">
          <h1 className="text-xl font-bold text-white mb-8 font-tt-commons">
            Admin Dashboard
          </h1>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-[#01C38D] text-[#191E29]'
                    : 'text-white hover:bg-[#01C38D]/10'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-2.5 text-white hover:bg-red-500/10 transition-colors lg:absolute lg:bottom-4 w-full lg:w-64"
          disabled={logoutLoading}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{logoutLoading ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-xl lg:text-2xl font-bold text-white font-tt-commons">
                Welcome, {user?.message?.name}
              </h1>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

