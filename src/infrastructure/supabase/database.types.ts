
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categories": {
                  Row: {
                    "icon": string,"id": number,"name_en": string,"name_ka": string,"slug": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "icon"?: string,"id"?: never,"name_en": string,"name_ka": string,"slug": string,"sort"?: number
                  }
                  Update: {
                    "icon"?: string,"id"?: never,"name_en"?: string,"name_ka"?: string,"slug"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"cities": {
                  Row: {
                    "id": number,"name_en": string,"name_ka": string,"slug": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"name_en": string,"name_ka": string,"slug": string,"sort"?: number
                  }
                  Update: {
                    "id"?: never,"name_en"?: string,"name_ka"?: string,"slug"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"portfolio_images": {
                  Row: {
                    "caption": string,"created_at": string,"id": string,"path": string,"sort": number,"thumb_path": string,"worker_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string,"created_at"?: string,"id"?: string,"path": string,"sort"?: number,"thumb_path": string,"worker_id": string
                  }
                  Update: {
                    "caption"?: string,"created_at"?: string,"id"?: string,"path"?: string,"sort"?: number,"thumb_path"?: string,"worker_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "portfolio_images_worker_id_fkey"
      columns: ["worker_id"]
isOneToOne: false
      referencedRelation: "worker_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"worker_categories": {
                  Row: {
                    "category_id": number,"worker_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": number,"worker_id": string
                  }
                  Update: {
                    "category_id"?: number,"worker_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "worker_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "worker_categories_worker_id_fkey"
      columns: ["worker_id"]
isOneToOne: false
      referencedRelation: "worker_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"worker_cities": {
                  Row: {
                    "city_id": number,"worker_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city_id": number,"worker_id": string
                  }
                  Update: {
                    "city_id"?: number,"worker_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "worker_cities_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "worker_cities_worker_id_fkey"
      columns: ["worker_id"]
isOneToOne: false
      referencedRelation: "worker_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"worker_profiles": {
                  Row: {
                    "avatar_path": string | null,"bio": string,"contact_email": string | null,"created_at": string,"facebook": string | null,"full_name": string,"headline": string,"id": string,"is_published": boolean,"phone": string | null,"search_text": string | null,"slug": string,"telegram": string | null,"updated_at": string,"viber": string | null,"website": string | null,"whatsapp": string | null,"years_experience": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"bio"?: string,"contact_email"?: string | null,"created_at"?: string,"facebook"?: string | null,"full_name"?: string,"headline"?: string,"id": string,"is_published"?: boolean,"phone"?: string | null,"search_text"?: never,"slug": string,"telegram"?: string | null,"updated_at"?: string,"viber"?: string | null,"website"?: string | null,"whatsapp"?: string | null,"years_experience"?: number | null
                  }
                  Update: {
                    "avatar_path"?: string | null,"bio"?: string,"contact_email"?: string | null,"created_at"?: string,"facebook"?: string | null,"full_name"?: string,"headline"?: string,"id"?: string,"is_published"?: boolean,"phone"?: string | null,"search_text"?: never,"slug"?: string,"telegram"?: string | null,"updated_at"?: string,"viber"?: string | null,"website"?: string | null,"whatsapp"?: string | null,"years_experience"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"worker_services": {
                  Row: {
                    "category_id": number | null,"created_at": string,"currency": string,"description": string,"id": string,"price_from": number | null,"price_to": number | null,"price_unit": Database["public"]['Enums']["price_unit"],"sort": number,"title": string,"worker_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: number | null,"created_at"?: string,"currency"?: string,"description"?: string,"id"?: string,"price_from"?: number | null,"price_to"?: number | null,"price_unit"?: Database["public"]['Enums']["price_unit"],"sort"?: number,"title": string,"worker_id": string
                  }
                  Update: {
                    "category_id"?: number | null,"created_at"?: string,"currency"?: string,"description"?: string,"id"?: string,"price_from"?: number | null,"price_to"?: number | null,"price_unit"?: Database["public"]['Enums']["price_unit"],"sort"?: number,"title"?: string,"worker_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "worker_services_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "worker_services_worker_id_fkey"
      columns: ["worker_id"]
isOneToOne: false
      referencedRelation: "worker_profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"platform_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "categories": number,"cities": number,"workers": number
            }[]
                           },
"search_workers":
{ Args: { "category_slugs"?: (string)[],"city_slugs"?: (string)[],"min_experience"?: number,"page_limit"?: number,"page_offset"?: number,"price_max"?: number,"q"?: string,"sort_by"?: string,"with_photos"?: boolean }; Returns: {
              "avatar_path": string,"category_slugs": (string)[],"city_slugs": (string)[],"cover_thumb_path": string,"currency": string,"full_name": string,"headline": string,"id": string,"min_price": number,"photo_count": number,"slug": string,"total_count": number,"updated_at": string,"years_experience": number
            }[]
                           }
          }
          Enums: {
            "price_unit": "fixed"|"hour"|"day"|"sqm"|"item"|"negotiable"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "price_unit": ["fixed", "hour", "day", "sqm", "item", "negotiable"]
          }
        }
} as const
