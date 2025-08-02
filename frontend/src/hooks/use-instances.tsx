import { useState } from 'react'
import axios from '@/lib/axios'
import { Instance, InstanceResponse } from '@/models/Instance'
import { toast } from 'sonner'

export const useInstances = () => {
  const [loading, setLoading] = useState(false)

  const buildImage = async (challengeId: number) => {
    setLoading(true)
    try {
      const response = await axios.post(`/api/challenges/${challengeId}/build`)
      toast.success('Image built successfully')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to build image'
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const startInstance = async (challengeId: number): Promise<InstanceResponse> => {
    setLoading(true)
    try {
      console.log(`Starting instance for challenge ID: ${challengeId}`)
      const response = await axios.post<InstanceResponse>(`/api/challenges/${challengeId}/start`)
      console.log('Instance started successfully:', response.data)
      toast.success('Instance started successfully')
      return response.data
    } catch (error: any) {
      console.error('Failed to start instance:', error)
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
      
      const errorKey = error.response?.data?.error
      let errorMessage = 'Failed to start instance'
      
      switch (errorKey) {
        case 'team_required':
          errorMessage = 'You must be in a team to start an instance'
          break
        case 'instance_already_running':
          errorMessage = 'An instance is already running for this challenge'
          break
        case 'max_instances_by_user_reached':
          errorMessage = 'You have reached the maximum number of instances'
          break
        case 'max_instances_by_team_reached':
          errorMessage = 'Your team has reached the maximum number of instances'
          break
        case 'docker_build_failed':
          errorMessage = 'Failed to build Docker image'
          break
        case 'challenge_not_docker_type':
          errorMessage = 'This challenge is not a Docker challenge'
          break
        case 'docker_config_not_found':
          errorMessage = 'Docker configuration not found'
          break
        case 'instance_create_failed':
          errorMessage = 'Failed to create instance'
          break
        default:
          errorMessage = error.response?.data?.error || 'Failed to start instance'
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const stopInstance = async (challengeId: number) => {
    setLoading(true)
    try {
      console.log(`Stopping instance for challenge ID: ${challengeId}`)
      const response = await axios.post(`/api/challenges/${challengeId}/stop`)
      console.log('Instance stopped successfully:', response.data)
      toast.success('Instance stopped successfully')
      return response.data
    } catch (error: any) {
      console.error('Failed to stop instance:', error)
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
      
      const errorMessage = error.response?.data?.error || 'Failed to stop instance'
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const killInstance = async (challengeId: number) => {
    setLoading(true)
    try {
      console.log(`Killing instance for challenge ID: ${challengeId}`)
      const response = await axios.post(`/api/challenges/${challengeId}/kill`)
      console.log('Instance killed successfully:', response.data)
      toast.success('Instance killed successfully')
      return response.data
    } catch (error: any) {
      console.error('Failed to kill instance:', error)
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
      
      const errorMessage = error.response?.data?.error || 'Failed to kill instance'
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getInstanceStatus = async (challengeId: number) => {
    try {
      console.log(`Getting instance status for challenge ID: ${challengeId}`)
      const response = await axios.get(`/api/challenges/${challengeId}/instance-status`)
      console.log('Instance status received:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Failed to get instance status:', error)
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
      return null
    }
  }

  return {
    loading,
    buildImage,
    startInstance,
    stopInstance,
    killInstance,
    getInstanceStatus
  }
} 