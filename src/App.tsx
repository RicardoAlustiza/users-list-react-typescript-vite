import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { SortBy, type User } from './types.d'
import { UsersListComponent } from './components/UsersListComponent'

function App () {
  const [users, setUsers] = useState<User[]>([])
  const [showColors, setShowColors] = useState(false)
  const [sorting, setSorting] = useState<SortBy>(SortBy.NONE)
  const [filterCountry, setFilterCountry] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const originalUsers = useRef<User[]>([]) /* Guardar un valor que se comparte entre renders pero que al cambiar, no vuelva a rednerizar el componente */

  const toggleColors = () => {
    setShowColors(!showColors)
  }

  const toggleSortByCountry = () => {
    const newSortingValue = sorting === SortBy.NONE ? SortBy.COUNTRY : SortBy.NONE
    setSorting(newSortingValue)
  }

  const handleDelete = (uuid: string) => {
    const filteredUsers = users.filter((user) => user.login.uuid !== uuid)
    setUsers(filteredUsers)
  }

  const handleReset = () => {
    setUsers(originalUsers.current)
  }

  const handleChangeSort = (sort: SortBy) => {
    setSorting(sort)
  }

  useEffect(() => {
    setLoading(true)
    setError(false)

    fetch(`https://randomuser.me/api?results=10&seed=ricks&page=${currentPage}`)
      .then(async res => {
        console.log(res.ok, res.status, res.statusText)

        if (!res.ok) throw new Error('Error en la petición')
        return await res.json()
      })
      .then(res => {
        setUsers(prevUsers => prevUsers.concat(res.results))
        originalUsers.current = res.results
      })
      .catch(err => {
        console.error(err)
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [currentPage])

  const filteredUsers = useMemo(() => {
    return filterCountry != null && filterCountry.length > 0
      ? users.filter((user) => {
        return user.location.country.toLowerCase().includes(filterCountry.toLowerCase())
      })
      : users
  }, [users, filterCountry])

  const sortedUsers = useMemo(() => {
    if (sorting === SortBy.NONE) return filteredUsers

    const compareProperties: Record<string, (user: User) => any> = {
      [SortBy.COUNTRY]: user => user.location.country,
      [SortBy.NAME]: user => user.name.first,
      [SortBy.LAST]: user => user.name.last
    }

    return filteredUsers.toSorted((a, b) => {
      const extractProperty = compareProperties[sorting]
      return extractProperty(a).localeCompare(extractProperty(b))
    })
  }, [filteredUsers, sorting])

  return (
    <div className='App'>
      <header>
        <button onClick={toggleColors}>Colorear filas</button>
        <button onClick={toggleSortByCountry}>{sorting === SortBy.COUNTRY ? 'No ordenar por país' : 'Ordenar por país'}</button>
        <button onClick={handleReset}>Restaurar usuarios</button>
        <input placeholder='Filtrar por país' onChange={(e) => {
          setFilterCountry(e.target.value)
        }}/>
      </header>
      <main>
        { users.length > 0 &&
          <UsersListComponent users={sortedUsers} showColors={showColors} deleteUser={handleDelete} changeSorting={handleChangeSort}/>
        }
        { loading && <p>Cargando...</p> }
        { !loading && error && <p>Ha habido un error</p> }
        { !loading && !error && users.length === 0 && <p>No hay usuarios</p> }
        { !loading && !error &&
          <button onClick={() => { setCurrentPage(currentPage + 1) }}>Cargar más resultados</button>
        }
      </main>
    </div>
  )
}

export default App
