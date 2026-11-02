import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import type { ModulePayload } from '@/api/modules'
import { FieldError } from '@/components/forms/FieldError'
import { Icon } from '@/components/Icon'
import type { ModuleFormation } from '@/types'
import { ModuleImageField } from './components/ModuleImageField'
import {
  DUREE_OPTIONS,
  DUREE_PRESET_SET,
  moduleSchema,
  type ModuleFormValues,
} from './components/moduleFormConfig'

export function ModuleFormDialog({
  visible,
  module,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  module: ModuleFormation | null
  saving: boolean
  onHide: () => void
  onSubmit: (payload: ModulePayload) => Promise<void>
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      ordre: 1,
      titre: '',
      duree: 1,
      sujets: '',
      description: '',
    },
  })

  const [customDuree, setCustomDuree] = useState(false)
  const customDureeInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageClear, setImageClear] = useState(false)
  const hasImage = Boolean(imageFile || (module?.image && !imageClear))

  useEffect(() => {
    if (!visible) return
    const duree = module?.duree ?? 1
    reset({
      ordre: module?.ordre ?? 1,
      titre: module?.titre ?? '',
      duree,
      sujets: (module?.sujets ?? []).join('\n'),
      description: module?.description ?? '',
    })
    // Une durée existante hors des propositions bascule directement en saisie libre.
    setCustomDuree(!DUREE_PRESET_SET.has(duree))
    setImageFile(null)
    setImageClear(false)
  }, [module, reset, visible])

  useEffect(() => {
    if (customDuree) customDureeInputRef.current?.focus()
  }, [customDuree])

  async function submit(values: ModuleFormValues) {
    const payload: ModulePayload = {
      ordre: values.ordre,
      titre: values.titre.trim(),
      duree: values.duree,
      // Un sujet par ligne dans le formulaire.
      sujets: values.sujets
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      description: values.description?.trim() ?? '',
    }

    // On n'envoie les champs d'image que s'ils changent réellement.
    if (imageFile) payload.image = imageFile
    if (imageClear) payload.image_clear = true

    await onSubmit(payload)
  }

  const footer = (
    <div className="flex flex-wrap justify-end items-center gap-2">
      <Button
        type="button"
        label="Annuler"
        icon="pi pi-times"
        severity="secondary"
        text
        onClick={onHide}
        disabled={saving}
      />
      <Button
        type="button"
        label={module ? 'Enregistrer' : 'Ajouter le module'}
        icon="pi pi-check"
        loading={saving}
        onClick={handleSubmit(submit)}
      />
    </div>
  )

  return (
    <Dialog
      header={module ? 'Modifier le module' : 'Ajouter un module'}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(94vw, 620px)' }}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4 pt-2" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Position
            </label>
            <Controller
              control={control}
              name="ordre"
              render={({ field }) => (
                <InputNumber
                  value={field.value}
                  onValueChange={(event) => field.onChange(event.value ?? undefined)}
                  min={1}
                  showButtons
                  buttonLayout="horizontal"
                  incrementButtonIcon="pi pi-plus"
                  decrementButtonIcon="pi pi-minus"
                  className="w-full"
                  inputClassName="w-full"
                />
              )}
            />
            <FieldError message={errors.ordre?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Durée
            </label>
            <Controller
              control={control}
              name="duree"
              render={({ field }) => (
                <>
                  <Dropdown
                    value={customDuree ? null : field.value}
                    options={DUREE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(event) => {
                      setCustomDuree(false)
                      field.onChange(event.value)
                    }}
                    placeholder={customDuree ? 'Autre durée' : 'Choisir une durée'}
                    scrollHeight="20rem"
                    panelClassName="duree-dropdown-panel"
                    panelFooterTemplate={(_, hide) => (
                      <button type="button"
                        
                        className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm font-semibold text-fongo-700 transition hover:bg-fongo-50"
                        onClick={() => {
                          setCustomDuree(true)
                          hide()
                        }}
                      >
                        <Icon className="pi pi-pencil text-xs" />
                        Saisir une autre durée
                      </button>
                    )}
                    className={`w-full ${customDuree && errors.duree ? 'p-invalid' : ''}`}
                  />
                  {customDuree && (
                    <div className="mt-2 animate-fade-in-up">
                      <label htmlFor="module-duree-custom" className="sr-only">
                        Durée personnalisée en heures
                      </label>
                      <InputNumber
                        inputId="module-duree-custom"
                        inputRef={customDureeInputRef}
                        value={Number.isFinite(field.value) ? field.value : null}
                        onValueChange={(event) => field.onChange(event.value ?? 0)}
                        min={0}
                        maxFractionDigits={0}
                        step={1}
                        suffix=" h"
                        className={`w-full ${errors.duree ? 'p-invalid' : ''}`}
                        inputClassName="w-full"
                      />
                    </div>
                  )}
                </>
              )}
            />
            <FieldError message={errors.duree?.message} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Titre du module
          </label>
          <Controller
            control={control}
            name="titre"
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ex. Troisième module"
                className={`w-full ${errors.titre ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.titre?.message} />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Icon className="pi pi-image text-xs text-fongo-500" />
            Image du module
            <span className="font-normal text-slate-400">(facultatif)</span>
          </label>
          <ModuleImageField
            inputId="module-image"
            currentUrl={module?.image}
            cleared={imageClear}
            file={imageFile}
            onSelect={(file) => {
              setImageFile(file)
              setImageClear(false)
            }}
            onRemove={() => {
              if (imageFile) {
                setImageFile(null)
              } else {
                setImageClear(true)
              }
            }}
          />
          {imageClear && module?.image && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-700">
              <Icon className="pi pi-info-circle" />
              L'image actuelle sera retirée à l'enregistrement.
              <button type="button"
                
                className="font-semibold underline underline-offset-2 transition hover:text-amber-900"
                onClick={() => setImageClear(false)}
              >
                Annuler le retrait
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {hasImage
              ? 'Cette image remplace les logos des sujets sur la carte.'
              : 'Sans image, les logos des sujets sont affichés sur la carte.'}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Sujets abordés
          </label>
          <p className="mb-1.5 text-xs text-slate-500">
            Un sujet par ligne, par exemple : HTML5 puis CSS3.
          </p>
          <Controller
            control={control}
            name="sujets"
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={5}
                autoResize
                placeholder={'HTML5\nCSS3\nJavaScript'}
                className={`w-full ${errors.sujets ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.sujets?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Description <span className="font-normal text-slate-400">(facultatif)</span>
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={3}
                autoResize
                placeholder="Présentez l'objectif de ce module…"
                className="w-full"
              />
            )}
          />
        </div>
      </form>
    </Dialog>
  )
}
