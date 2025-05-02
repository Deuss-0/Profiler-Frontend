"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, AlertCircle, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for available team members
const availableMembers = [
  { id: 1, nickname: "techmaster", name: "John Doe", avatar: "/placeholder.svg" },
  { id: 2, nickname: "codewizard", name: "Jane Smith", avatar: "/placeholder.svg" },
  { id: 3, nickname: "debugger", name: "Mike Johnson", avatar: "/placeholder.svg" },
  { id: 4, nickname: "devninja", name: "Sarah Wilson", avatar: "/placeholder.svg" },
  { id: 5, nickname: "bytecoder", name: "Chris Brown", avatar: "/placeholder.svg" },
  { id: 6, nickname: "algoguru", name: "Emma Davis", avatar: "/placeholder.svg" },
]

interface TeamMember {
  id: number
  nickname: string
  name: string
  avatar: string
}

interface TeamSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  minTeamSize: number
  maxTeamSize: number
  onConfirm: (members: TeamMember[]) => void
}

export function _TeamSelectionDialog({
  open,
  onOpenChange,
  minTeamSize,
  maxTeamSize,
  onConfirm,
}: TeamSelectionDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const [_searchOpen, _setSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectMember = (member: TeamMember) => {
    if (selectedMembers.length >= maxTeamSize) {
      setError(`No puedes seleccionar más de ${maxTeamSize} miembros`)
      return
    }
    if (selectedMembers.find((m) => m.id === member.id)) return
    setSelectedMembers([...selectedMembers, member])
    setError(null)
  }

  const handleRemoveMember = (memberId: number) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== memberId))
    setError(null)
  }

  const handleConfirm = () => {
    if (selectedMembers.length < minTeamSize) {
      setError(`Debes seleccionar al menos ${minTeamSize} compañeros para unirte a este evento.`)
      return
    }
    onConfirm(selectedMembers)
    setSelectedMembers([]) // Reset selection after confirming
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)}></div>
      <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-[525px] p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seleccionar Equipo
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Busca y selecciona a tus compañeros de equipo para este evento. Mínimo {minTeamSize} y máximo{" "}
              {maxTeamSize} participantes.
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="space-y-4 my-4">
          <Command className="rounded-lg border border-slate-800 bg-slate-950">
            <CommandInput placeholder="Buscar por nickname..." />
            <CommandList>
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <ScrollArea className="h-[200px]">
                <CommandGroup>
                  {availableMembers
                    .filter((member) => !selectedMembers.find((m) => m.id === member.id))
                    .map((member) => (
                      <CommandItem
                        key={member.id}
                        onSelect={() => handleSelectMember(member)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.nickname} />
                            <AvatarFallback>{member.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.nickname}</p>
                            <p className="text-xs text-slate-400">{member.name}</p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>

          {selectedMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-400">Equipo seleccionado</h4>
                <span className="text-xs text-slate-500">
                  {selectedMembers.length} de {maxTeamSize} miembros
                </span>
              </div>
              <div className="grid gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 pr-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.nickname} />
                        <AvatarFallback>{member.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.nickname}</p>
                        <p className="text-xs text-slate-400">{member.name}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-900 text-red-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="bg-slate-800 hover:bg-slate-700">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-cyan-600 hover:bg-cyan-700">
            Confirmar equipo y unirme
          </Button>
        </div>
      </div>
    </div>
  )
}
