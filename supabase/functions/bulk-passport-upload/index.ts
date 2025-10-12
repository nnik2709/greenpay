// Supabase Edge Function: bulk-passport-upload
// Parses Excel file and creates passports in bulk
// Request: POST multipart/form-data with 'file' field (Excel/CSV)
// Response: 200 { success: true, passports: [...], errors: [...] }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

interface PassportRow {
  passportNo?: string
  surname?: string
  givenName?: string
  nationality?: string
  dob?: string
  sex?: string
  dateOfExpiry?: string
  placeOfBirth?: string
  placeOfIssue?: string
  dateOfIssue?: string
  fileNumber?: string
  email?: string
  phone?: string
}

interface ProcessedPassport {
  passport_number: string
  surname: string
  given_name: string
  nationality: string
  date_of_birth: string
  sex: string
  date_of_expiry: string
  place_of_birth?: string
  place_of_issue?: string
  date_of_issue?: string
  file_number?: string
  email?: string
  phone?: string
  created_by: string
}

function validateRow(row: PassportRow, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!row.passportNo || row.passportNo.trim().length < 5) {
    errors.push(`Row ${index + 1}: Passport number is required and must be at least 5 characters`)
  }
  if (!row.surname || row.surname.trim().length === 0) {
    errors.push(`Row ${index + 1}: Surname is required`)
  }
  if (!row.givenName || row.givenName.trim().length === 0) {
    errors.push(`Row ${index + 1}: Given name is required`)
  }
  if (!row.nationality || row.nationality.trim().length === 0) {
    errors.push(`Row ${index + 1}: Nationality is required`)
  }
  if (!row.dob) {
    errors.push(`Row ${index + 1}: Date of birth is required`)
  }
  if (!row.sex || !['Male', 'Female', 'Other', 'M', 'F'].includes(row.sex)) {
    errors.push(`Row ${index + 1}: Sex must be Male, Female, or Other`)
  }
  if (!row.dateOfExpiry) {
    errors.push(`Row ${index + 1}: Passport expiry date is required`)
  }

  return { valid: errors.length === 0, errors }
}

function transformRow(row: PassportRow, userId: string): ProcessedPassport {
  // Normalize sex values
  let sex = row.sex || 'Other'
  if (sex === 'M') sex = 'Male'
  if (sex === 'F') sex = 'Female'

  return {
    passport_number: row.passportNo!.trim().toUpperCase(),
    surname: row.surname!.trim(),
    given_name: row.givenName!.trim(),
    nationality: row.nationality!.trim(),
    date_of_birth: row.dob!,
    sex,
    date_of_expiry: row.dateOfExpiry!,
    place_of_birth: row.placeOfBirth?.trim(),
    place_of_issue: row.placeOfIssue?.trim(),
    date_of_issue: row.dateOfIssue,
    file_number: row.fileNumber?.trim(),
    email: row.email?.trim(),
    phone: row.phone?.trim(),
    created_by: userId,
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    // Parse Excel/CSV
    let workbook: any
    try {
      workbook = XLSX.read(data, { type: 'array' })
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Failed to parse file. Please ensure it is a valid Excel or CSV file.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as PassportRow[]

    if (jsonData.length === 0) {
      return new Response(JSON.stringify({ error: 'File is empty or has no data' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (jsonData.length > 10000) {
      return new Response(JSON.stringify({ error: 'Maximum 10,000 passports per upload' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate all rows first
    const allErrors: string[] = []
    const validRows: ProcessedPassport[] = []

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const { valid, errors } = validateRow(row, i)
      
      if (!valid) {
        allErrors.push(...errors)
      } else {
        try {
          validRows.push(transformRow(row, user.id))
        } catch (transformError) {
          allErrors.push(`Row ${i + 1}: Failed to process - ${transformError}`)
        }
      }
    }

    // If validation errors exist, return them without inserting
    if (allErrors.length > 0 && validRows.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Validation failed',
        errors: allErrors.slice(0, 50), // Limit to first 50 errors
        totalErrors: allErrors.length
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Insert valid passports (in batches of 500)
    const batchSize = 500
    const inserted: any[] = []
    const insertErrors: string[] = []

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize)
      
      const { data: batchData, error: batchError } = await supabase
        .from('passports')
        .insert(batch)
        .select('id, passport_number, surname, given_name')

      if (batchError) {
        // Handle duplicate passport numbers
        if (batchError.message && /duplicate key value/i.test(batchError.message)) {
          insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: Duplicate passport numbers detected`)
        } else {
          insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`)
        }
      } else {
        inserted.push(...(batchData || []))
      }
    }

    // Create upload log
    const { error: logError } = await supabase
      .from('bulk_uploads')
      .insert({
        filename: file.name,
        total_rows: jsonData.length,
        successful_rows: inserted.length,
        failed_rows: jsonData.length - inserted.length,
        errors: JSON.stringify([...allErrors, ...insertErrors]),
        uploaded_by: user.id,
        status: inserted.length > 0 ? 'completed' : 'failed'
      })

    if (logError) {
      console.error('Failed to create upload log:', logError)
    }

    return new Response(JSON.stringify({ 
      success: inserted.length > 0,
      passports: inserted,
      totalProcessed: jsonData.length,
      successCount: inserted.length,
      errorCount: allErrors.length + insertErrors.length,
      errors: [...allErrors, ...insertErrors].slice(0, 100), // Limit errors in response
      message: `Successfully processed ${inserted.length} out of ${jsonData.length} passports`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (e: any) {
    console.error('bulk-passport-upload error', e)
    return new Response(JSON.stringify({ 
      error: 'Server error: ' + (e.message || 'Unknown error') 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})


