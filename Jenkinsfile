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

        stage('ECR Login') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-ecr']
                ]) {
                    sh '''
                aws ecr get-login-password --region ap-south-1 |
                docker login --username AWS --password-stdin 155409187448.dkr.ecr.ap-south-1.amazonaws.com
            '''
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