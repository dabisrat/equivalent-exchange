'use client'

import { useState, useEffect } from 'react'
import {supabase} from '@PNN/libs/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Session } from '@supabase/supabase-js'
import Home from '../home/page'

export default function Login() {
  const [session, setSession] = useState<Session | null>({} as any)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])


  // if (!session) {
    // return (<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />)

  // }else {
    return <Home  user={session?.user}/>
    
  // }
}