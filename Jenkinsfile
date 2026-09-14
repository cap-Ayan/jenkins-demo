pipeline {
    agent any


     environment {
        ECR_REGISTRY = '155409187448.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPOSITORY = 'jenkins/demo1'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    tools {
        nodejs 'node22'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Use Secret') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'my-secret',
                        variable: 'MY_SECRET'
                    )
                ]) {
                    sh 'echo "Secret is available: $MY_SECRET"'
                }
            }
        }

        stage('Docker Build') {
    steps {
        sh 'docker build -t jenkins-demo:${IMAGE_TAG} .'
        echo "Docker build completed with tag: ${IMAGE_TAG}"
    }
}


        stage('ECR Login') {
    steps {
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding',
             credentialsId: 'aws-ecr']
        ]) {
            sh '''
                aws ecr get-login-password --region ap-south-1 |
                docker login --username AWS --password-stdin \
                155409187448.dkr.ecr.ap-south-1.amazonaws.com
            '''
        }
    }
}

stage('Push to ECR') {
    steps {
        sh '''
            docker tag jenkins-demo:${IMAGE_TAG} \
            ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

            docker push \
            ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
        '''
    }
}

stage('Deploy to EC2') {
    steps {
        sshagent(['ec2-ssh']) {
            sh '''
                ssh -o StrictHostKeyChecking=no ubuntu@13.232.177.130 "
                    aws ecr get-login-password --region ap-south-1 |
                    docker login --username AWS --password-stdin ${ECR_REGISTRY} &&

                    docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} &&

                    docker stop jenkins-demo || true &&
                    docker rm jenkins-demo || true &&

                    docker run -d \
                    --name jenkins-demo \
                    -p 3000:3000 \
                    ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                "
            '''
        }
    }
}
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed!'
        }
    }
}