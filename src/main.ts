import * as core from '@actions/core'
import * as github from '@actions/github'
import {createAppAuth} from '@octokit/auth-app'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      appId: core.getInput('app-id'),
      appPrivateKey: core.getInput('app-private-key'),
      appInstallationId: core.getInput('app-installation-id'),
      repository: core.getInput('repository'),
      eventType: core.getInput('event-type'),
      clientPayload: core.getInput('client-payload')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')

    let auth: any = undefined
    if (
      !!inputs.appId &&
      !!inputs.appPrivateKey &&
      !!inputs.appInstallationId
    ) {
      auth = {
        appId: inputs.appId,
        installationId: inputs.appInstallationId,
        privateKey: inputs.appPrivateKey
      }
      inputs.token = ''
    }
    const authStrategy = auth ? createAppAuth : undefined

    if (!inputs.token && !auth) {
      core.setFailed(
        'either the "token" input must be set, or the "app-*" inputs.'
      )
      return
    }

    const octokit = github.getOctokit(inputs.token, {authStrategy, auth})

    await octokit.rest.repos.createDispatchEvent({
      owner: owner,
      repo: repo,
      event_type: inputs.eventType,
      client_payload: JSON.parse(inputs.clientPayload)
    })
  } catch (error: any) {
    core.debug(inspect(error))
    if (error.status == 404) {
      core.setFailed(
        'Repository not found, OR token has insufficient permissions.'
      )
    } else {
      core.setFailed(error.message)
    }
  }
}

run()
