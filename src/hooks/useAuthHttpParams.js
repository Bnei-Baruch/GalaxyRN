import { useUserStore } from '../zustand/user'
import { useMemo } from 'react'

const useAuthHttpParams = () => {
  const { token, username, password } = useUserStore()
  const auth = token ?
    `Bearer ${token}`
    : `Basic ${btoa(`${username}:${password}`)}`

  return useMemo(() => {
    return (
      {
        headers: {
          Authorization: auth,
        },
      }
    )
  }, [auth])
}
export default useAuthHttpParams

