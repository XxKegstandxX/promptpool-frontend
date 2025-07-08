import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface User {
  id: number
  address: string
  referral_code: string
  total_referrals: number
  total_earnings: number
  created_at: string
  updated_at: string
}

export interface Referral {
  id: number
  referee_address: string
  referrer_address: string
  referrer_code: string
  status: 'pending' | 'confirmed' | 'paid'
  bonus_amount: number
  created_at: string
}

export interface ReferralPayment {
  id: number
  referrer_address: string
  referee_address: string
  prompt_submission_id: string
  bonus_amount: number
  transaction_hash?: string
  paid_at: string
}

// Service functions
export class ReferralService {
  
  // Create or get user with referral code
  static async createUser(address: string): Promise<User | null> {
    try {
      // Generate referral code from address
      const referralCode = address.slice(2, 8).toUpperCase()
      
      const { data, error } = await supabase
        .from('users')
        .upsert(
          { 
            address, 
            referral_code: referralCode 
          },
          { 
            onConflict: 'address',
            ignoreDuplicates: false 
          }
        )
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }
  
  // Get user by address
  static async getUser(address: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('address', address)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }
  
  // Find user by referral code
  static async getUserByReferralCode(code: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', code)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error finding user by referral code:', error)
      return null
    }
  }
  
  // Track a referral
  static async trackReferral(refereeAddress: string, referrerCode: string): Promise<boolean> {
    try {
      // Find referrer by code
      const referrer = await this.getUserByReferralCode(referrerCode)
      if (!referrer) {
        console.error('Invalid referral code:', referrerCode)
        return false
      }
      
      // Create referral record
      const { error } = await supabase
        .from('referrals')
        .insert({
          referee_address: refereeAddress,
          referrer_address: referrer.address,
          referrer_code: referrerCode,
          status: 'confirmed'
        })
      
      if (error) throw error
      
      // Update referrer's stats
      await supabase
        .from('users')
        .update({ 
          total_referrals: referrer.total_referrals + 1,
          updated_at: new Date().toISOString()
        })
        .eq('address', referrer.address)
      
      return true
    } catch (error) {
      console.error('Error tracking referral:', error)
      return false
    }
  }
  
  // Check if user was referred
  static async getReferralInfo(address: string): Promise<Referral | null> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referee_address', address)
        .single()
      
      if (error) return null
      return data
    } catch (error) {
      return null
    }
  }
  
  // Pay referral bonus
  static async payReferralBonus(
    refereeAddress: string, 
    promptId: string, 
    bonusAmount: number,
    txHash?: string
  ): Promise<boolean> {
    try {
      // Get referral info
      const referral = await this.getReferralInfo(refereeAddress)
      if (!referral) return false
      
      // Record payment
      const { error: paymentError } = await supabase
        .from('referral_payments')
        .insert({
          referrer_address: referral.referrer_address,
          referee_address: refereeAddress,
          prompt_submission_id: promptId,
          bonus_amount: bonusAmount,
          transaction_hash: txHash
        })
      
      if (paymentError) throw paymentError
      
      // Update referrer's total earnings
      const referrer = await this.getUser(referral.referrer_address)
      if (referrer) {
        await supabase
          .from('users')
          .update({ 
            total_earnings: referrer.total_earnings + bonusAmount,
            updated_at: new Date().toISOString()
          })
          .eq('address', referrer.address)
      }
      
      return true
    } catch (error) {
      console.error('Error paying referral bonus:', error)
      return false
    }
  }
  
  // Get user's referral statistics
  static async getReferralStats(address: string) {
    try {
      const user = await this.getUser(address)
      if (!user) return null
      
      // Get list of referred users
      const { data: referredUsers } = await supabase
        .from('referrals')
        .select('referee_address, created_at')
        .eq('referrer_address', address)
        .order('created_at', { ascending: false })
      
      return {
        referralCode: user.referral_code,
        totalReferrals: user.total_referrals,
        totalEarnings: user.total_earnings,
        referredUsers: referredUsers || []
      }
    } catch (error) {
      console.error('Error getting referral stats:', error)
      return null
    }
  }
}