"use client"

// Inspired by react-hot-toast library
import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        toastTimeouts.forEach((_, id) => {
          if (id === toastId) {
            if (toastTimeouts.has(id)) {
              clearTimeout(toastTimeouts.get(id))
              toastTimeouts.delete(id)
            }
          }
        })
      } else {
        toastTimeouts.forEach((timeout) => {
          clearTimeout(timeout)
        })
        toastTimeouts.clear()
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const useToastReducer = () => {
  const [state, setState] = useState<State>({ toasts: [] })

  const dispatch = useCallback((action: Action) => {
    setState((prev) => reducer(prev, action))
  }, [])

  return { state, dispatch }
}

export type { ToasterToast }
export function useToast() {
  const { state, dispatch } = useToastReducer()

  const toast = useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = uuidv4()
      const newToast = { id, ...props }

      dispatch({
        type: "ADD_TOAST",
        toast: newToast,
      })

      return {
        id,
        dismiss: () => {
          dispatch({ type: "DISMISS_TOAST", toastId: id })
        },
        update: (props: ToasterToast) => {
          dispatch({
            type: "UPDATE_TOAST",
            toast: { ...props, id },
          })
        },
      }
    },
    [dispatch]
  )

  const dismiss = useCallback(
    (toastId?: string) => {
      dispatch({ type: "DISMISS_TOAST", toastId })
    },
    [dispatch]
  )

  useEffect(() => {
    state.toasts.forEach((toast) => {
      if (toast.open === false && !toastTimeouts.has(toast.id)) {
        const timeout = setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", toastId: toast.id })
        }, TOAST_REMOVE_DELAY)

        toastTimeouts.set(toast.id, timeout)
      }
    })

    return () => {
      toastTimeouts.forEach((timeout) => {
        clearTimeout(timeout)
      })
      toastTimeouts.clear()
    }
  }, [state.toasts, dispatch])

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  }
}
