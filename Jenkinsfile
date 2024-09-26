pipeline {
  agent {
    dockerfile true
  }
  stages {
    stage('Build and Push Docker Image') {
      environment {
        DOCKER_IMAGE = "hubadmin/tentoro:api-router:${BUILD_NUMBER}"
        REGISTRY_CREDENTIALS = credentials('docker-cred')
      }
      steps {
        script {
            sh 'cd ~/api-router-new && docker build --no-cache -t ${DOCKER_IMAGE} --build-arg PROFILE=colo .'
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
            sh '''
                cd ~/api-router-new
                git config user.email "areebghani359@gmail.com"
                git config user.name "Areeb Abdul Ghani"
                BUILD_NUMBER=${BUILD_NUMBER}
                sed -i "s/replaceImageTag/${BUILD_NUMBER}/g" api-router-new/deployment.yaml
                git add api-router-new/deployment.yaml
                git commit -m "Update deployment image to version ${BUILD_NUMBER}"
                git push https://${GITHUB_TOKEN}@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME} HEAD:cloud
            '''
        }
      }
    }
  }
}

