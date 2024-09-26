pipeline {
  agent {
    docker {
      image 'hubadmin/jenkins-node-docker-agent:v1'
      args '--user root -v /var/run/docker.sock:/var/run/docker.sock' // Mount Docker socket to access the host's Docker daemon
    }
  }
  stages {
    stage('Checkout') {
      steps {
        // Checkout the code from the Git repository
        git branch: 'cloud', url: 'https://github.com/Tentoro-Technologies/api-router-new'
      }
    }

    stage('Build and Push Docker Image') {
      environment {
        DOCKER_IMAGE = "hubadmin/tentoro:api-router-${BUILD_NUMBER}"
        REGISTRY_CREDENTIALS = credentials('docker-cred')
      }
      steps {
        script {
          // Build Docker image with the proper tag
          sh 'docker build --no-cache -t ${DOCKER_IMAGE} --build-arg PROFILE=colo .'

          // Check if Docker image was built successfully before pushing
          sh 'docker image inspect ${DOCKER_IMAGE} || exit 1'

          // Push Docker image to the registry
          def dockerImage = docker.image("${DOCKER_IMAGE}")
          docker.withRegistry('https://index.docker.io/v1/', "docker-cred") {
            dockerImage.push()
          }
        }
      }
    }

    stage('Update Deployment File') {
      environment {
        GIT_REPO_NAME = "api-router-new"
        GIT_USER_NAME = "AreebAbdulGhani"
      }
      steps {
        withCredentials([string(credentialsId: 'github-cred', variable: 'GITHUB_TOKEN')]) {
          script {
            sh '''
              git config user.email "areebghani359@gmail.com"
              git config user.name "Areeb Abdul Ghani"

              # Replace placeholder with build number in deployment.yaml
              sed -i "s/replaceImageTag/${BUILD_NUMBER}/g" deployment.yaml
              
              # Add, commit, and push the changes
              git add deployment.yaml
              git commit -m "Update deployment image to version ${BUILD_NUMBER}"
              
              # Ensure pushing to the correct branch (cloud)
              git push https://${GITHUB_TOKEN}@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME} HEAD:cloud
            '''
          }
        }
      }
    }
  }
  post {
    failure {
      script {
        echo 'Build failed! Check logs for details.'
      }
    }
    success {
      script {
        echo 'Build and deployment steps were successful!'
      }
    }
  }
}

