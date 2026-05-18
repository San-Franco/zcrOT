import { useEffect } from "react"

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} | zcrOT Demo`

    return () => { document.title = "zcrOT Demo"; }
  }, [title])
}

export default useTitle
