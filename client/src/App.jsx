import { useEffect, useState } from 'react'
import './App.css'
import { api } from './api'

function App() {
  const [activity, setActivity] = useState('')
  const [feedback, setFeedback] = useState({ text: '', type: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activities, setActivities] = useState([])
  const [isActivitiesVisible, setIsActivitiesVisible] = useState(false)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activitiesError, setActivitiesError] = useState('')
  const [categories, setCategories] = useState([])
  const [isCategoriesVisible, setIsCategoriesVisible] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')

  useEffect(() => {
    api
      .get('/api/categories')
      .then((result) => {
        if (Array.isArray(result)) {
          setCategories(result)
        }
      })
      .catch(() => {
        // silently ignore; the category dropdown will just be empty until "See categories" is used
      })
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    const name = activity.trim()

    if (!name) {
      setFeedback({ text: 'Enter an activity first.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setFeedback({ text: '', type: '' })

    try {
      const result = await api.post('/api/activities', { name })

      setFeedback({ text: `Saved: ${result.name || name}`, type: 'success' })
      if (isActivitiesVisible) {
        setActivities((currentActivities) => [result, ...currentActivities])
      }
      setActivity('')
    } catch (error) {
      setFeedback({
        text: error.message || 'Could not connect to the server.',
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLoadActivities() {
    if (isActivitiesVisible) {
      setIsActivitiesVisible(false)
      return
    }

    setIsActivitiesVisible(true)
    setIsLoadingActivities(true)
    setActivitiesError('')

    try {
      const result = await api.get('/api/activities')

      if (!Array.isArray(result)) {
        throw new Error('The server returned an invalid activity list.')
      }

      setActivities(result)
    } catch (error) {
      setActivitiesError(error.message || 'Could not connect to the server.')
    } finally {
      setIsLoadingActivities(false)
    }
  }

  async function handleDeleteActivity(id) {
    try {
      await api.delete(`/api/activities/${id}`)
      setActivities((currentActivities) => currentActivities.filter((entry) => entry._id !== id))
    } catch (error) {
      setActivitiesError(error.message || 'Could not connect to the server.')
    }
  }

  async function handleChangeActivityCategory(id, category) {
    try {
      const result = await api.patch(`/api/activities/${id}`, { category })
      setActivities((currentActivities) =>
        currentActivities.map((entry) => (entry._id === id ? result : entry))
      )
    } catch (error) {
      setActivitiesError(error.message || 'Could not connect to the server.')
    }
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm('Delete all saved activities? This cannot be undone.')
    if (!confirmed) {
      return
    }

    try {
      await api.delete('/api/activities')
      setActivities([])
    } catch (error) {
      setActivitiesError(error.message || 'Could not connect to the server.')
    }
  }

  async function handleLoadCategories() {
    if (isCategoriesVisible) {
      setIsCategoriesVisible(false)
      return
    }

    setIsCategoriesVisible(true)
    setIsLoadingCategories(true)
    setCategoriesError('')

    try {
      const result = await api.get('/api/categories')

      if (!Array.isArray(result)) {
        throw new Error('The server returned an invalid category list.')
      }

      setCategories(result)
    } catch (error) {
      setCategoriesError(error.message || 'Could not connect to the server.')
    } finally {
      setIsLoadingCategories(false)
    }
  }

  async function handleAddCategory(event) {
    event.preventDefault()
    const name = newCategory.trim()

    if (!name) {
      return
    }

    try {
      const result = await api.post('/api/categories', { name })
      setCategories((current) => [...current, result].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCategory('')
    } catch (error) {
      setCategoriesError(error.message || 'Could not connect to the server.')
    }
  }

  function handleStartEditCategory(category) {
    setEditingCategoryId(category._id)
    setEditingCategoryName(category.name)
  }

  function handleCancelEditCategory() {
    setEditingCategoryId(null)
    setEditingCategoryName('')
  }

  async function handleSaveCategory(id) {
    const name = editingCategoryName.trim()

    if (!name) {
      return
    }

    try {
      const result = await api.patch(`/api/categories/${id}`, { name })

      setCategories((current) =>
        current
          .map((category) => (category._id === id ? result : category))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      handleCancelEditCategory()
    } catch (error) {
      setCategoriesError(error.message || 'Could not connect to the server.')
    }
  }

  async function handleDeleteCategory(id) {
    try {
      await api.delete(`/api/categories/${id}`)
      setCategories((current) => current.filter((category) => category._id !== id))
    } catch (error) {
      setCategoriesError(error.message || 'Could not connect to the server.')
    }
  }

  return (
    <main className="activity-home">
      <section className="activity-entry" aria-labelledby="page-title">
        <h1 id="page-title">Activity Tracker</h1>
        <form className="activity-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <input
            aria-label="Activity"
            autoComplete="off"
            maxLength={120}
            required
            onChange={(event) => {
              setActivity(event.target.value)
              setFeedback({ text: '', type: '' })
            }}
            placeholder="What activity did you do?"
            value={activity}
            disabled={isSubmitting}
          />
          <div className="activity-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add activity'}
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={handleLoadActivities}
              disabled={isLoadingActivities}
              aria-expanded={isActivitiesVisible}
              aria-controls="activities-results"
            >
              {isLoadingActivities ? 'Loading...' : isActivitiesVisible ? 'Hide activities' : 'See activities'}
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={handleLoadCategories}
              disabled={isLoadingCategories}
              aria-expanded={isCategoriesVisible}
              aria-controls="categories-results"
            >
              {isLoadingCategories ? 'Loading...' : isCategoriesVisible ? 'Hide categories' : 'See categories'}
            </button>
          </div>
        </form>
        <p className={`confirmation ${feedback.type}`} aria-live="polite" role={feedback.type === 'error' ? 'alert' : undefined}>
          {feedback.text}
        </p>
        {isActivitiesVisible && (
          <section id="activities-results" className="activity-results" aria-labelledby="activities-heading">
            <h2 id="activities-heading">Saved activities</h2>
            {isLoadingActivities ? (
              <p className="list-message" aria-live="polite">Loading activities...</p>
            ) : activitiesError ? (
              <p className="list-message error" role="alert">{activitiesError}</p>
            ) : activities.length === 0 ? (
              <p className="list-message">No activities yet.</p>
            ) : (
              <ul className="activity-list">
                {activities.map((savedActivity) => (
                  <li className="activity-row" key={savedActivity._id}>
                    <span className="activity-details">
                      <span>{savedActivity.name}</span>
                      {savedActivity.category && (
                        <select
                          className="category-tag category-select"
                          aria-label={`Category for ${savedActivity.name}`}
                          value={savedActivity.category}
                          onChange={(event) => handleChangeActivityCategory(savedActivity._id, event.target.value)}
                        >
                          {!categories.some((category) => category.name === savedActivity.category) && (
                            <option value={savedActivity.category}>{savedActivity.category}</option>
                          )}
                          {categories.map((category) => (
                            <option key={category._id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </span>
                    <time dateTime={savedActivity.createdAt}>
                      {new Date(savedActivity.createdAt).toLocaleString()}
                    </time>
                    <button
                      type="button"
                      className="delete-button"
                      aria-label={`Delete ${savedActivity.name}`}
                      onClick={() => handleDeleteActivity(savedActivity._id)}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {isActivitiesVisible && activities.length > 0 && (
          <button type="button" className="delete-all-button" onClick={handleDeleteAll}>
            Delete all activities
          </button>
        )}
        {isCategoriesVisible && (
          <section id="categories-results" className="category-results" aria-labelledby="categories-heading">
            <h2 id="categories-heading">Categories</h2>
            {isLoadingCategories ? (
              <p className="list-message" aria-live="polite">Loading categories...</p>
            ) : categoriesError ? (
              <p className="list-message error" role="alert">{categoriesError}</p>
            ) : categories.length === 0 ? (
              <p className="list-message">No categories yet.</p>
            ) : (
              <ul className="category-list">
                {categories.map((category) => (
                  <li className="category-row" key={category._id}>
                    {editingCategoryId === category._id ? (
                      <>
                        <input
                          className="category-edit-input"
                          aria-label="Edit category name"
                          maxLength={40}
                          value={editingCategoryName}
                          onChange={(event) => setEditingCategoryName(event.target.value)}
                          autoFocus
                        />
                        <button type="button" className="category-save-button" onClick={() => handleSaveCategory(category._id)}>
                          Save
                        </button>
                        <button type="button" className="category-cancel-button" onClick={handleCancelEditCategory}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span>{category.name}</span>
                        <span className="category-row-actions">
                          <button
                            type="button"
                            className="category-edit-button"
                            aria-label={`Edit ${category.name}`}
                            onClick={() => handleStartEditCategory(category)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="delete-button"
                            aria-label={`Delete ${category.name}`}
                            onClick={() => handleDeleteCategory(category._id)}
                          >
                            &times;
                          </button>
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <form className="category-add-form" onSubmit={handleAddCategory}>
              <input
                aria-label="New category name"
                autoComplete="off"
                maxLength={40}
                placeholder="New category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
              />
              <button type="submit">Add category</button>
            </form>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
