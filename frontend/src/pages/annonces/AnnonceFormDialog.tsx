import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import type { AnnoncePayload } from '@/api/annonces'
import { useObjectUrl } from '@/lib/useObjectUrl'
import type { Annonce } from '@/types'
import { AnnonceFields } from './components/AnnonceFields'
import { Icon } from '@/components/Icon'
import { AnnoncePreview } from './components/AnnoncePreview'
import { annonceSchema, type AnnonceFormValues } from './components/annonceFormConfig'

export function AnnonceFormDialog({
  visible,
  annonce,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  annonce: Annonce | null
  saving: boolean
  onHide: () => void
  onSubmit: (payload: AnnoncePayload) => Promise<void>
}) {
  // Images de l'affiche : fichiers choisis + retrait des images en base.
  const [image1File, setImage1File] = useState<File | null>(null)
  const [image2File, setImage2File] = useState<File | null>(null)
  const [image1Clear, setImage1Clear] = useState(false)
  const [image2Clear, setImage2Clear] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnonceFormValues>({
    resolver: zodResolver(annonceSchema),
    // Le dialogue est monté à chaque ouverture : les valeurs initiales
    // proviennent directement de l'annonce éditée.
    defaultValues: {
      object: annonce?.object ?? '',
      contenu: annonce?.contenu ?? '',
      cible: annonce?.cible ?? 'tous',
      template: annonce?.template ?? 'standard',
      date_prevue: annonce?.date_prevue
        ? dayjs(annonce.date_prevue).toDate()
        : dayjs().add(1, 'day').hour(9).minute(0).second(0).toDate(),
    },
  })

  const template = useWatch({ control, name: 'template' })
  const objectValue = useWatch({ control, name: 'object' })
  const contenuValue = useWatch({ control, name: 'contenu' })
  const cibleValue = useWatch({ control, name: 'cible' })
  const dateValue = useWatch({ control, name: 'date_prevue' })

  const image1Url = useObjectUrl(image1File)
  const image2Url = useObjectUrl(image2File)
  const image1Preview =
    image1Url ?? (image1Clear ? null : (annonce?.image1 ?? null))
  const image2Preview =
    image2Url ?? (image2Clear ? null : (annonce?.image2 ?? null))

  async function submit(values: AnnonceFormValues) {
    const payload: AnnoncePayload = {
      object: values.object,
      contenu: values.contenu,
      cible: values.cible,
      template: values.template,
      date_prevue: values.date_prevue.toISOString(),
    }

    if (values.template === 'fongo_expo') {
      payload.image1 = image1File
      payload.image2 = image2File
      if (image1Clear) payload.image1_clear = true
      if (image2Clear) payload.image2_clear = true
    }

    await onSubmit(payload)
  }

  function selectImage1(file: File) {
    setImage1File(file)
    setImage1Clear(false)
  }

  function selectImage2(file: File) {
    setImage2File(file)
    setImage2Clear(false)
  }

  function removeImage1() {
    if (image1File) setImage1File(null)
    else setImage1Clear(true)
  }

  function removeImage2() {
    if (image2File) setImage2File(null)
    else setImage2Clear(true)
  }

  const previewPanel = (
    <AnnoncePreview
      template={template}
      cible={cibleValue}
      dateValue={dateValue}
      objectValue={objectValue}
      contenuValue={contenuValue}
      image1Preview={image1Preview}
      image2Preview={image2Preview}
    />
  )

  const dialogHeader = (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fongo-100 text-fongo-900 shadow-sm">
        <Icon className={`pi ${annonce ? 'pi-pencil' : 'pi-megaphone'} text-lg`} />
      </span>
      <div>
        <p className="text-base font-bold text-slate-900">
          {annonce ? "Modifier l'annonce" : 'Ajouter une annonce'}
        </p>
        <p className="text-xs text-slate-500">
          Rédigez, prévisualisez puis publiez votre message.
        </p>
      </div>
    </div>
  )

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
        <Icon className="pi pi-info-circle" />
        L'annonce sera diffusée selon le public choisi.
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
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
          label={annonce ? 'Enregistrer' : "Publier l'annonce"}
          icon="pi pi-check"
          loading={saving}
          onClick={handleSubmit(submit)}
        />
      </div>
    </div>
  )

  return (
    <Dialog
      header={dialogHeader}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(96vw, 1020px)' }}
    >
      <form onSubmit={handleSubmit(submit)} className="pt-2" noValidate>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <AnnonceFields
            annonce={annonce}
            control={control}
            errors={errors}
            contenuLength={contenuValue?.length ?? 0}
            template={template}
            image1File={image1File}
            image2File={image2File}
            image1Clear={image1Clear}
            image2Clear={image2Clear}
            onSelectImage1={selectImage1}
            onSelectImage2={selectImage2}
            onRemoveImage1={removeImage1}
            onRemoveImage2={removeImage2}
          />

          <aside className="hidden lg:block">
            <div className="sticky top-2">{previewPanel}</div>
          </aside>
        </div>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-1 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Icon className="pi pi-eye text-fongo-600" />
              Aperçu de l'annonce
            </span>
            <Icon className="pi pi-chevron-down text-xs text-slate-400" />
          </summary>
          <div className="p-2 pt-0">{previewPanel}</div>
        </details>
      </form>
    </Dialog>
  )
}
