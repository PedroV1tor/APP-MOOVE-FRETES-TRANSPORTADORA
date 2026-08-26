export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          category: string | null
          company_id: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_config: {
        Row: {
          config: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ciot_operations: {
        Row: {
          blocked_reason: string | null
          ciot_number: string | null
          contratado_id: string | null
          contratante_id: string | null
          created_at: string
          freight_id: string
          generated_at: string | null
          generated_by: string | null
          id: string
          operation_type: string | null
          piso_minimo_aplicavel: number | null
          provider: string
          raw_response: Json | null
          status: string
          subcontratado_id: string | null
          updated_at: string
          valor_operacao: number | null
        }
        Insert: {
          blocked_reason?: string | null
          ciot_number?: string | null
          contratado_id?: string | null
          contratante_id?: string | null
          created_at?: string
          freight_id: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          operation_type?: string | null
          piso_minimo_aplicavel?: number | null
          provider?: string
          raw_response?: Json | null
          status?: string
          subcontratado_id?: string | null
          updated_at?: string
          valor_operacao?: number | null
        }
        Update: {
          blocked_reason?: string | null
          ciot_number?: string | null
          contratado_id?: string | null
          contratante_id?: string | null
          created_at?: string
          freight_id?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          operation_type?: string | null
          piso_minimo_aplicavel?: number | null
          provider?: string
          raw_response?: Json | null
          status?: string
          subcontratado_id?: string | null
          updated_at?: string
          valor_operacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ciot_operations_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          is_super_admin: boolean
          last_access: string | null
          name: string
          phone: string | null
          role_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_super_admin?: boolean
          last_access?: string | null
          name: string
          phone?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_super_admin?: boolean
          last_access?: string | null
          name?: string
          phone?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active_freights: number
          address: Json | null
          certifications: Json
          cnpj: string | null
          company_name: string
          company_subtype: string
          company_type: string
          completed_freights: number
          created_at: string
          description: string | null
          email: string | null
          fleet_size: number | null
          id: string
          is_individual: boolean
          logo_url: string | null
          main_cpf: string | null
          municipal_registration: string | null
          ocb_registration: string | null
          operating_states: string[] | null
          phone: string | null
          rating: number
          representative_cnh: string | null
          representative_cpf: string | null
          representative_email: string | null
          representative_name: string | null
          representative_phone: string | null
          representative_rg: string | null
          representative_role: string | null
          review_count: number
          rntrc: string | null
          rntrc_expiry: string | null
          rntrc_status: string
          state_registration: string | null
          status: string
          trading_name: string | null
          updated_at: string
          user_id: string
          verification_status: string
          website: string | null
        }
        Insert: {
          active_freights?: number
          address?: Json | null
          certifications?: Json
          cnpj?: string | null
          company_name: string
          company_subtype?: string
          company_type: string
          completed_freights?: number
          created_at?: string
          description?: string | null
          email?: string | null
          fleet_size?: number | null
          id?: string
          is_individual?: boolean
          logo_url?: string | null
          main_cpf?: string | null
          municipal_registration?: string | null
          ocb_registration?: string | null
          operating_states?: string[] | null
          phone?: string | null
          rating?: number
          representative_cnh?: string | null
          representative_cpf?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_phone?: string | null
          representative_rg?: string | null
          representative_role?: string | null
          review_count?: number
          rntrc?: string | null
          rntrc_expiry?: string | null
          rntrc_status?: string
          state_registration?: string | null
          status?: string
          trading_name?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          website?: string | null
        }
        Update: {
          active_freights?: number
          address?: Json | null
          certifications?: Json
          cnpj?: string | null
          company_name?: string
          company_subtype?: string
          company_type?: string
          completed_freights?: number
          created_at?: string
          description?: string | null
          email?: string | null
          fleet_size?: number | null
          id?: string
          is_individual?: boolean
          logo_url?: string | null
          main_cpf?: string | null
          municipal_registration?: string | null
          ocb_registration?: string | null
          operating_states?: string[] | null
          phone?: string | null
          rating?: number
          representative_cnh?: string | null
          representative_cpf?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_phone?: string | null
          representative_rg?: string | null
          representative_role?: string | null
          review_count?: number
          rntrc?: string | null
          rntrc_expiry?: string | null
          rntrc_status?: string
          state_registration?: string | null
          status?: string
          trading_name?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      company_saved_contacts: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_saved_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          deleted_by_participant1: boolean
          deleted_by_participant2: boolean
          destination_city: string | null
          destination_state: string | null
          freight_id: string | null
          id: string
          is_muted: boolean
          is_pinned: boolean
          last_message_at: string | null
          last_message_content: string | null
          last_message_read: boolean
          last_message_sender_id: string | null
          metadata: Json
          origin_city: string | null
          origin_state: string | null
          participant1_id: string
          participant2_id: string
          source: string
          source_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_by_participant1?: boolean
          deleted_by_participant2?: boolean
          destination_city?: string | null
          destination_state?: string | null
          freight_id?: string | null
          id?: string
          is_muted?: boolean
          is_pinned?: boolean
          last_message_at?: string | null
          last_message_content?: string | null
          last_message_read?: boolean
          last_message_sender_id?: string | null
          metadata?: Json
          origin_city?: string | null
          origin_state?: string | null
          participant1_id: string
          participant2_id: string
          source?: string
          source_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_by_participant1?: boolean
          deleted_by_participant2?: boolean
          destination_city?: string | null
          destination_state?: string | null
          freight_id?: string | null
          id?: string
          is_muted?: boolean
          is_pinned?: boolean
          last_message_at?: string | null
          last_message_content?: string | null
          last_message_read?: boolean
          last_message_sender_id?: string | null
          metadata?: Json
          origin_city?: string | null
          origin_state?: string | null
          participant1_id?: string
          participant2_id?: string
          source?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          permissions: Json
          role_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json
          role_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: string
          file_path: string
          id: string
          owner_type: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_path: string
          id?: string
          owner_type: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_path?: string
          id?: string
          owner_type?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          address: Json | null
          antt_vehicle: string | null
          availability_expires_at: string | null
          available: boolean
          birth_date: string | null
          body_types: string[] | null
          cnh: string | null
          cnh_category: string
          cnh_expiry: string | null
          completed_trips: number
          cpf: string | null
          created_at: string
          current_location: Json | null
          driver_classification: string
          experience_years: number | null
          id: string
          name: string
          payment_account_holder: string
          payment_account_holder_doc: string | null
          payment_account_holder_name: string | null
          phone: string | null
          profile_image: string | null
          punctuality: number
          rating: number
          renavam: string | null
          rg: string | null
          rntrc: string | null
          rntrc_expiry: string | null
          rntrc_status: string
          specializations: string[] | null
          trailer_type: string | null
          updated_at: string
          user_id: string
          vehicle_capacity: number | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
          vehicle_types: string[] | null
          vehicle_year: string | null
        }
        Insert: {
          address?: Json | null
          antt_vehicle?: string | null
          availability_expires_at?: string | null
          available?: boolean
          birth_date?: string | null
          body_types?: string[] | null
          cnh?: string | null
          cnh_category?: string
          cnh_expiry?: string | null
          completed_trips?: number
          cpf?: string | null
          created_at?: string
          current_location?: Json | null
          driver_classification?: string
          experience_years?: number | null
          id?: string
          name: string
          payment_account_holder?: string
          payment_account_holder_doc?: string | null
          payment_account_holder_name?: string | null
          phone?: string | null
          profile_image?: string | null
          punctuality?: number
          rating?: number
          renavam?: string | null
          rg?: string | null
          rntrc?: string | null
          rntrc_expiry?: string | null
          rntrc_status?: string
          specializations?: string[] | null
          trailer_type?: string | null
          updated_at?: string
          user_id: string
          vehicle_capacity?: number | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_types?: string[] | null
          vehicle_year?: string | null
        }
        Update: {
          address?: Json | null
          antt_vehicle?: string | null
          availability_expires_at?: string | null
          available?: boolean
          birth_date?: string | null
          body_types?: string[] | null
          cnh?: string | null
          cnh_category?: string
          cnh_expiry?: string | null
          completed_trips?: number
          cpf?: string | null
          created_at?: string
          current_location?: Json | null
          driver_classification?: string
          experience_years?: number | null
          id?: string
          name?: string
          payment_account_holder?: string
          payment_account_holder_doc?: string | null
          payment_account_holder_name?: string | null
          phone?: string | null
          profile_image?: string | null
          punctuality?: number
          rating?: number
          renavam?: string | null
          rg?: string | null
          rntrc?: string | null
          rntrc_expiry?: string | null
          rntrc_status?: string
          specializations?: string[] | null
          trailer_type?: string | null
          updated_at?: string
          user_id?: string
          vehicle_capacity?: number | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_types?: string[] | null
          vehicle_year?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          company_id: string | null
          created_at: string
          driver_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_responsible_contacts: {
        Row: {
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          freight_id: string
          id: string
          is_main_contact: boolean
          source: string
          source_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          freight_id: string
          id?: string
          is_main_contact?: boolean
          source?: string
          source_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          freight_id?: string
          id?: string
          is_main_contact?: boolean
          source?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_responsible_contacts_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
      freights: {
        Row: {
          abaixo_do_piso: boolean
          accepted_driver_id: string | null
          accepted_driver_name: string | null
          advance_payment_percent: number | null
          body_types: string[] | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cargo_type: string | null
          ciot_status: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          deadline_date: string | null
          delivery_date: string | null
          description: string | null
          destination_address: string | null
          destination_cep: string | null
          destination_city: string | null
          destination_coordinates: Json | null
          destination_state: string | null
          distance_km: number | null
          duration_hours: number | null
          expires_at: string | null
          freight_code: string | null
          id: string
          is_fractioned: boolean
          is_full_load: boolean
          is_urgent: boolean
          load_classification: string | null
          metadata: Json
          operation_type: string | null
          origin_address: string | null
          origin_cep: string | null
          origin_city: string | null
          origin_coordinates: Json | null
          origin_state: string | null
          payment_account_type: string | null
          pickup_date: string | null
          piso_minimo_calculado_em: string | null
          piso_minimo_valor: number | null
          published_at: string | null
          publisher_id: string
          publisher_phone: string | null
          quantity: string | null
          requirements: Json | null
          scheduled_date: string | null
          status: string
          title: string | null
          updated_at: string
          vale_pedagio_status: string
          value_estimate: number | null
          vehicle_types: string[] | null
          views_count: number
          visibility: string
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          abaixo_do_piso?: boolean
          accepted_driver_id?: string | null
          accepted_driver_name?: string | null
          advance_payment_percent?: number | null
          body_types?: string[] | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cargo_type?: string | null
          ciot_status?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          delivery_date?: string | null
          description?: string | null
          destination_address?: string | null
          destination_cep?: string | null
          destination_city?: string | null
          destination_coordinates?: Json | null
          destination_state?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          expires_at?: string | null
          freight_code?: string | null
          id?: string
          is_fractioned?: boolean
          is_full_load?: boolean
          is_urgent?: boolean
          load_classification?: string | null
          metadata?: Json
          operation_type?: string | null
          origin_address?: string | null
          origin_cep?: string | null
          origin_city?: string | null
          origin_coordinates?: Json | null
          origin_state?: string | null
          payment_account_type?: string | null
          pickup_date?: string | null
          piso_minimo_calculado_em?: string | null
          piso_minimo_valor?: number | null
          published_at?: string | null
          publisher_id: string
          publisher_phone?: string | null
          quantity?: string | null
          requirements?: Json | null
          scheduled_date?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          vale_pedagio_status?: string
          value_estimate?: number | null
          vehicle_types?: string[] | null
          views_count?: number
          visibility?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          abaixo_do_piso?: boolean
          accepted_driver_id?: string | null
          accepted_driver_name?: string | null
          advance_payment_percent?: number | null
          body_types?: string[] | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cargo_type?: string | null
          ciot_status?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          delivery_date?: string | null
          description?: string | null
          destination_address?: string | null
          destination_cep?: string | null
          destination_city?: string | null
          destination_coordinates?: Json | null
          destination_state?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          expires_at?: string | null
          freight_code?: string | null
          id?: string
          is_fractioned?: boolean
          is_full_load?: boolean
          is_urgent?: boolean
          load_classification?: string | null
          metadata?: Json
          operation_type?: string | null
          origin_address?: string | null
          origin_cep?: string | null
          origin_city?: string | null
          origin_coordinates?: Json | null
          origin_state?: string | null
          payment_account_type?: string | null
          pickup_date?: string | null
          piso_minimo_calculado_em?: string | null
          piso_minimo_valor?: number | null
          published_at?: string | null
          publisher_id?: string
          publisher_phone?: string | null
          quantity?: string | null
          requirements?: Json | null
          scheduled_date?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          vale_pedagio_status?: string
          value_estimate?: number | null
          vehicle_types?: string[] | null
          views_count?: number
          visibility?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          insurer_name: string | null
          notes: string | null
          owner_id: string
          owner_type: string
          policy_number: string | null
          policy_type: string
          status: string
          updated_at: string
          valid_from: string | null
          valid_until: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          insurer_name?: string | null
          notes?: string | null
          owner_id: string
          owner_type: string
          policy_number?: string | null
          policy_type: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          insurer_name?: string | null
          notes?: string | null
          owner_id?: string
          owner_type?: string
          policy_number?: string | null
          policy_type?: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      mdfe_records: {
        Row: {
          chave_acesso: string | null
          ciot_operation_id: string | null
          created_at: string
          freight_id: string
          id: string
          issued_at: string | null
          issued_by: string | null
          numero_mdfe: string | null
          status: string
          updated_at: string
        }
        Insert: {
          chave_acesso?: string | null
          ciot_operation_id?: string | null
          created_at?: string
          freight_id: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          numero_mdfe?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          chave_acesso?: string | null
          ciot_operation_id?: string | null
          created_at?: string
          freight_id?: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          numero_mdfe?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdfe_records_ciot_operation_id_fkey"
            columns: ["ciot_operation_id"]
            isOneToOne: false
            referencedRelation: "ciot_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdfe_records_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json
          read_at: string | null
          reported: boolean
          sender_id: string
        }
        Insert: {
          attachments?: Json
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json
          read_at?: string | null
          reported?: boolean
          sender_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json
          read_at?: string | null
          reported?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          icon: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      piso_minimo_coefficients: {
        Row: {
          categoria_carga: string
          cc: number
          ccd: number
          eixos: number
          fonte: string | null
          id: string
          needs_verification: boolean
          tabela: string
          updated_at: string
          updated_by: string | null
          vigente_desde: string
        }
        Insert: {
          categoria_carga: string
          cc: number
          ccd: number
          eixos: number
          fonte?: string | null
          id?: string
          needs_verification?: boolean
          tabela?: string
          updated_at?: string
          updated_by?: string | null
          vigente_desde?: string
        }
        Update: {
          categoria_carga?: string
          cc?: number
          ccd?: number
          eixos?: number
          fonte?: string | null
          id?: string
          needs_verification?: boolean
          tabela?: string
          updated_at?: string
          updated_by?: string | null
          vigente_desde?: string
        }
        Relationships: []
      }
      preferred_routes: {
        Row: {
          accepts_partial_load: boolean
          available_from: string | null
          available_until: string | null
          capacity_kg: number | null
          contacts_count: number
          created_at: string
          description: string | null
          destination: Json
          driver_id: string
          id: string
          is_active: boolean
          metadata: Json
          minimum_value: number | null
          notes: string | null
          origin: Json
          preferred_cargo_types: string[] | null
          price_per_km: number | null
          priority: string
          updated_at: string
          vehicle_types: string[] | null
          views_count: number
        }
        Insert: {
          accepts_partial_load?: boolean
          available_from?: string | null
          available_until?: string | null
          capacity_kg?: number | null
          contacts_count?: number
          created_at?: string
          description?: string | null
          destination: Json
          driver_id: string
          id?: string
          is_active?: boolean
          metadata?: Json
          minimum_value?: number | null
          notes?: string | null
          origin: Json
          preferred_cargo_types?: string[] | null
          price_per_km?: number | null
          priority?: string
          updated_at?: string
          vehicle_types?: string[] | null
          views_count?: number
        }
        Update: {
          accepts_partial_load?: boolean
          available_from?: string | null
          available_until?: string | null
          capacity_kg?: number | null
          contacts_count?: number
          created_at?: string
          description?: string | null
          destination?: Json
          driver_id?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          minimum_value?: number | null
          notes?: string | null
          origin?: Json
          preferred_cargo_types?: string[] | null
          price_per_km?: number | null
          priority?: string
          updated_at?: string
          vehicle_types?: string[] | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "preferred_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          target_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cancelled_freights: number
          city: string | null
          cnpj: string | null
          completed_freights: number
          cpf: string | null
          created_at: string
          email: string
          email_verified: boolean
          followers_count: number
          following_count: number
          id: string
          is_admin: boolean
          is_online: boolean
          last_login_at: string | null
          last_seen: string | null
          metadata: Json
          name: string
          phone: string | null
          push_token: string | null
          push_token_updated_at: string | null
          rating: number
          state: string | null
          status: string
          total_distance_km: number
          total_earnings: number
          total_freights: number
          total_ratings: number
          updated_at: string
          user_type: string
          verification_status: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cancelled_freights?: number
          city?: string | null
          cnpj?: string | null
          completed_freights?: number
          cpf?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          followers_count?: number
          following_count?: number
          id: string
          is_admin?: boolean
          is_online?: boolean
          last_login_at?: string | null
          last_seen?: string | null
          metadata?: Json
          name: string
          phone?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          rating?: number
          state?: string | null
          status?: string
          total_distance_km?: number
          total_earnings?: number
          total_freights?: number
          total_ratings?: number
          updated_at?: string
          user_type: string
          verification_status?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cancelled_freights?: number
          city?: string | null
          cnpj?: string | null
          completed_freights?: number
          cpf?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          followers_count?: number
          following_count?: number
          id?: string
          is_admin?: boolean
          is_online?: boolean
          last_login_at?: string | null
          last_seen?: string | null
          metadata?: Json
          name?: string
          phone?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          rating?: number
          state?: string | null
          status?: string
          total_distance_km?: number
          total_earnings?: number
          total_freights?: number
          total_ratings?: number
          updated_at?: string
          user_type?: string
          verification_status?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          categories: Json | null
          comment: string | null
          communication_rating: number | null
          created_at: string
          evaluator_id: string
          evaluator_name: string | null
          evaluator_type: string | null
          freight_code: string | null
          freight_id: string | null
          id: string
          overall_rating: number
          professionalism_rating: number | null
          punctuality_rating: number | null
          report_reason: string | null
          reported: boolean
          status: string
          target_id: string
          target_name: string | null
          target_type: string | null
          updated_at: string
        }
        Insert: {
          categories?: Json | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          evaluator_id: string
          evaluator_name?: string | null
          evaluator_type?: string | null
          freight_code?: string | null
          freight_id?: string | null
          id?: string
          overall_rating: number
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          report_reason?: string | null
          reported?: boolean
          status?: string
          target_id: string
          target_name?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Update: {
          categories?: Json | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          evaluator_id?: string
          evaluator_name?: string | null
          evaluator_type?: string | null
          freight_code?: string | null
          freight_id?: string | null
          id?: string
          overall_rating?: number
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          report_reason?: string | null
          reported?: boolean
          status?: string
          target_id?: string
          target_name?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rntrc_verifications: {
        Row: {
          checked_at: string
          checked_by: string | null
          created_at: string
          id: string
          method: string
          notes: string | null
          owner_id: string
          owner_type: string
          rntrc_number: string | null
          status: string
        }
        Insert: {
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          owner_id: string
          owner_type: string
          rntrc_number?: string | null
          status?: string
        }
        Update: {
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          owner_id?: string
          owner_type?: string
          rntrc_number?: string | null
          status?: string
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          attachments: Json
          author_id: string
          comments_count: number
          content: string
          created_at: string
          id: string
          images: string[] | null
          likes_count: number
          location: string | null
          metadata: Json
          shares_count: number
          tags: string[] | null
          type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          attachments?: Json
          author_id: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          likes_count?: number
          location?: string | null
          metadata?: Json
          shares_count?: number
          tags?: string[] | null
          type?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          attachments?: Json
          author_id?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          likes_count?: number
          location?: string | null
          metadata?: Json
          shares_count?: number
          tags?: string[] | null
          type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          created_at: string
          freight_id: string | null
          id: string
          is_archived: boolean
          last_message: Json | null
          participants: string[]
          status: string
          type: string
          unread_count: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          freight_id?: string | null
          id?: string
          is_archived?: boolean
          last_message?: Json | null
          participants: string[]
          status?: string
          type?: string
          unread_count?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          freight_id?: string | null
          id?: string
          is_archived?: boolean
          last_message?: Json | null
          participants?: string[]
          status?: string
          type?: string
          unread_count?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          description: string | null
          driver_id: string | null
          event_type: string
          freight_id: string
          id: string
          images: string[] | null
          location: Json | null
          notes: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          driver_id?: string | null
          event_type: string
          freight_id: string
          id?: string
          images?: string[] | null
          location?: Json | null
          notes?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          driver_id?: string | null
          event_type?: string
          freight_id?: string
          id?: string
          images?: string[] | null
          location?: Json | null
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          external_id: string | null
          fee: number
          freight_id: string | null
          gateway_response: Json | null
          id: string
          metadata: Json
          net_amount: number | null
          payer_id: string | null
          payment_method: string | null
          payment_status: string
          processed_at: string | null
          receipt_path: string | null
          receiver_id: string | null
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          fee?: number
          freight_id?: string | null
          gateway_response?: Json | null
          id?: string
          metadata?: Json
          net_amount?: number | null
          payer_id?: string | null
          payment_method?: string | null
          payment_status?: string
          processed_at?: string | null
          receipt_path?: string | null
          receiver_id?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          fee?: number
          freight_id?: string | null
          gateway_response?: Json | null
          id?: string
          metadata?: Json
          net_amount?: number | null
          payer_id?: string | null
          payment_method?: string | null
          payment_status?: string
          processed_at?: string | null
          receipt_path?: string | null
          receiver_id?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          chat_notifications: boolean
          created_at: string
          currency: string
          distance_unit: string
          email_alerts: boolean
          freight_alerts: boolean
          id: string
          language: string
          marketing_emails: boolean
          notification_settings: Json
          notifications_enabled: boolean
          privacy_settings: Json
          push_notifications: boolean
          sms_alerts: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_notifications?: boolean
          created_at?: string
          currency?: string
          distance_unit?: string
          email_alerts?: boolean
          freight_alerts?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          notification_settings?: Json
          notifications_enabled?: boolean
          privacy_settings?: Json
          push_notifications?: boolean
          sms_alerts?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_notifications?: boolean
          created_at?: string
          currency?: string
          distance_unit?: string
          email_alerts?: boolean
          freight_alerts?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          notification_settings?: Json
          notifications_enabled?: boolean
          privacy_settings?: Json
          push_notifications?: boolean
          sms_alerts?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vale_pedagio_records: {
        Row: {
          created_at: string
          freight_id: string
          id: string
          provider: string
          registered_at: string | null
          status: string
          tag_number: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          freight_id: string
          id?: string
          provider?: string
          registered_at?: string | null
          status?: string
          tag_number?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          freight_id?: string
          id?: string
          provider?: string
          registered_at?: string | null
          status?: string
          tag_number?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vale_pedagio_records_freight_id_fkey"
            columns: ["freight_id"]
            isOneToOne: false
            referencedRelation: "freights"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_post_likes: { Args: { post_id: string }; Returns: undefined }
      get_app_secret: { Args: { secret_name: string }; Returns: string }
      increment_post_likes: { Args: { post_id: string }; Returns: undefined }
      increment_route_views: { Args: { route_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_company_collaborator: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      is_company_super_admin: {
        Args: { p_company_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
