import { useParams, useSearchParams } from 'react-router-dom'
import PublicTicketForm from '../components/ticket/PublicTicketForm'

export default function NewTicketPage() {
  const { orgId } = useParams()
  const [searchParams] = useSearchParams()
  const empresa = searchParams.get('empresa') || ''
  return <PublicTicketForm orgId={orgId} empresa={empresa} />
}
