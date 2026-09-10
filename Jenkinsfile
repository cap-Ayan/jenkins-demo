pipeline {
    agent any

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
                sh 'docker build -t jenkins-demo:1.0 .'
                echo 'Docker build completed!'
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
            docker tag jenkins-demo:1.0 \
            155409187448.dkr.ecr.ap-south-1.amazonaws.com/jenkins/demo1:1.0

            docker push \
            155409187448.dkr.ecr.ap-south-1.amazonaws.com/jenkins/demo1:1.0
        '''
    }
}

stage('Test EC2 SSH') {
    steps {
        sshagent(['ec2-ssh']) {
            sh '''
                ssh -o StrictHostKeyChecking=no \
                ubuntu@13.232.177.130 \
               docker pull 155409187448.dkr.ecr.ap-south-1.amazonaws.com/jenkins/demo1:1.0 &&
                    docker stop jenkins-demo || true &&
                    docker rm jenkins-demo || true &&
                    docker run -d --name jenkins-demo -p 3000:3000 155409187448.dkr.ecr.ap-south-1.amazonaws.com/jenkins/demo1:1.0
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