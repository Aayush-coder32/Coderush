import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import client from '../../lib/api'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [overview, setOverview] = useState(null)
  const [credit, setCredit] = useState({ userId: '', amount: 100 })

  const load = async () => {
    const [u, o] = await Promise.all([client.get('/admin/users'), client.get('/campus/admin/overview')])
    setUsers(u.data.data || [])
    setOverview(o.data.data)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load users')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const setRole = async (id, role) => {
    try {
      await client.patch(`/admin/users/${id}/role`, { role })
      toast.success('Role updated')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const addWallet = async (e) => {
    e.preventDefault()
    try {
      await client.post('/admin/wallet', {
        userId: credit.userId,
        amount: Number(credit.amount),
      })
      toast.success('Wallet credited')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const roleChart =
    overview?.usersByRole &&
    Object.entries(overview.usersByRole).map(([name, value]) => ({
      name,
      value,
    }))

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin command center</h1>

      {overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Events', overview.eventCount],
            ['Attendance rows', overview.attendanceCount],
            ['Open complaints', overview.openComplaints],
            ['Active loans', overview.activeLoans],
          ].map(([label, val]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
            </div>
          ))}
        </div>
      )}

      {roleChart?.length > 0 && (
        <div className="h-64 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Users by role</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={roleChart}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <form
        onSubmit={addWallet}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label className="text-xs font-medium text-slate-500">User ID</label>
          <input
            value={credit.userId}
            onChange={(e) => setCredit({ ...credit, userId: e.target.value })}
            className="mt-1 block w-64 rounded-lg border border-slate-300 px-2 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            placeholder="Mongo _id"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Amount ₹</label>
          <input
            type="number"
            value={credit.amount}
            onChange={(e) => setCredit({ ...credit, amount: e.target.value })}
            className="mt-1 block w-28 rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Credit wallet
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Wallet ₹</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.walletBalance}</td>
                <td className="p-3 space-x-1">
                  {['student', 'faculty', 'admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(u._id, r)}
                      className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-800"
                    >
                      {r}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
