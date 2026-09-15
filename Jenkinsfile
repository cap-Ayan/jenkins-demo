pipeline {
    agent any


     environment {
        ECR_REGISTRY = '155409187448.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPOSITORY = 'jenkins/demo1'
        IMAGE_TAG = "${params.DEPLOY_VERSION ?: BUILD_NUMBER}"
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
    when {
        expression {
            !params.DEPLOY_VERSION?.trim()
        }
    }
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
    when {
        expression {
            !params.DEPLOY_VERSION?.trim()
        }
    }
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
                ssh -o StrictHostKeyChecking=no ubuntu@13.232.177.130 '
                    
                    ACTIVE_PORT=$(grep -oP "proxy_pass http://127\\.0\\.0\\.1:\\K[0-9]+" /etc/nginx/sites-available/jenkins-demo)

                    if [ "$ACTIVE_PORT" = "3000" ]; then
                        NEW_PORT=3001
                    else
                        NEW_PORT=3000
                    fi

                    echo "Active port: $ACTIVE_PORT"
                    echo "New port: $NEW_PORT"

                    docker rm -f jenkins-demo-green 2>/dev/null || true

                    aws ecr get-login-password --region ap-south-1 |
                    docker login --username AWS --password-stdin '"${ECR_REGISTRY}"' &&

                    docker pull '"${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"' &&

                    docker run -d \
                        --name jenkins-demo-green \
                        -p $NEW_PORT:3000 \
                        '"${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"'

                    sleep 5

                    if curl -f http://localhost:$NEW_PORT; then
                        echo "Green container is healthy"
                    else
                        echo "Green container is unhealthy"
                        docker logs jenkins-demo-green
                        docker rm -f jenkins-demo-green
                        exit 1
                    fi
                '
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