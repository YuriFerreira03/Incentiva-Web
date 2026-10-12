import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { PerfilProvider } from './providers/PerfilProvider'
import { router } from './app/router'

export default function App() {
  return (
    <AuthProvider>
      <PerfilProvider>
        <RouterProvider router={router} />
      </PerfilProvider>
    </AuthProvider>
  )
}
