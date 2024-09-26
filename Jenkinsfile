pipeline {
  agent {
    docker {
      image 'abhishekf5/maven-abhishek-docker-agent:v1'
      args '--user root -v /var/run/docker.sock:/var/run/docker.sock' // mount Docker socket to access the host's Docker daemon
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
            sh 'docker build --no-cache -t ${DOCKER_IMAGE} --build-arg PROFILE=colo .'
            def dockerImage = docker.image("${DOCKER_IMAGE}")
            docker.withRegistry('https://index.docker.io/v1/', "docker-cred") {
                dockerImage.push()
            }
        }
      }
    }

    stage('Update Deployment File') {
      environment {
        GIT_REPO_URL = "https://github.com/Tentoro-Technologies/api-router-new.git" // Correct repository URL
        GIT_USER_NAME = "AreebAbdulGhani"
        GIT_EMAIL = "areebghani359@gmail.com"
      }
      steps {
        withCredentials([string(credentialsId: 'github-cred', variable: 'GITHUB_TOKEN')]) {
            script {
                sh '''
                    git config user.email "${GIT_EMAIL}"
                    git config user.name "${GIT_USER_NAME}"
                    BUILD_NUMBER=${BUILD_NUMBER}
                    sed -i "s/replaceImageTag/${BUILD_NUMBER}/g" deployment.yaml
                    git add deployment.yaml
                    git commit -m "Update deployment image to version ${BUILD_NUMBER}"
                    git push https://${GITHUB_TOKEN}@github.com/Tentoro-Technologies/api-router-new.git HEAD:cloud
                '''
            }
        }
      }
    }
  }
}

