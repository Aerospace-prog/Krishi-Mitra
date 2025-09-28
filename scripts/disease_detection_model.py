"""
Crop Disease Detection Model using CNN
This module contains the CNN architecture and training pipeline for detecting crop diseases from images.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import joblib
from pathlib import Path
import json
from typing import Dict, List, Tuple, Optional
import cv2
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiseaseDetectionModel:
    """
    CNN-based crop disease detection model using transfer learning with MobileNetV2.
    Supports multiple crop types and their common diseases.
    """
    
    def __init__(self, input_shape: Tuple[int, int, int] = (224, 224, 3), num_classes: int = 38):
        """
        Initialize the disease detection model.
        
        Args:
            input_shape: Input image shape (height, width, channels)
            num_classes: Number of disease classes to predict
        """
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = None
        self.class_names = []
        self.model_path = None
        
        # Comprehensive crop diseases mapping for all PlantVillage classes
        self.disease_info = {
            # Apple diseases
            'Apple___Apple_scab': {
                'crop': 'Apple',
                'disease': 'Apple Scab',
                'severity': 'Moderate',
                'description': 'Fungal disease causing dark spots on leaves and fruit'
            },
            'Apple___Black_rot': {
                'crop': 'Apple',
                'disease': 'Black Rot',
                'severity': 'High',
                'description': 'Fungal disease causing fruit rot and leaf spots'
            },
            'Apple___Cedar_apple_rust': {
                'crop': 'Apple',
                'disease': 'Cedar Apple Rust',
                'severity': 'Moderate',
                'description': 'Fungal disease causing orange spots on leaves'
            },
            'Apple___healthy': {
                'crop': 'Apple',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Blueberry
            'Blueberry___healthy': {
                'crop': 'Blueberry',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Cherry diseases
            'Cherry_(including_sour)___Powdery_mildew': {
                'crop': 'Cherry',
                'disease': 'Powdery Mildew',
                'severity': 'Moderate',
                'description': 'Fungal disease causing white powdery coating on leaves'
            },
            'Cherry_(including_sour)___healthy': {
                'crop': 'Cherry',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Corn diseases
            'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
                'crop': 'Corn',
                'disease': 'Gray Leaf Spot',
                'severity': 'Moderate',
                'description': 'Fungal disease causing gray rectangular lesions on leaves'
            },
            'Corn_(maize)___Common_rust_': {
                'crop': 'Corn',
                'disease': 'Common Rust',
                'severity': 'Moderate',
                'description': 'Fungal disease causing rust-colored pustules on leaves'
            },
            'Corn_(maize)___Northern_Leaf_Blight': {
                'crop': 'Corn',
                'disease': 'Northern Leaf Blight',
                'severity': 'High',
                'description': 'Fungal disease causing large tan lesions on leaves'
            },
            'Corn_(maize)___healthy': {
                'crop': 'Corn',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Grape diseases
            'Grape___Black_rot': {
                'crop': 'Grape',
                'disease': 'Black Rot',
                'severity': 'High',
                'description': 'Fungal disease causing black spots on leaves and fruit mummification'
            },
            'Grape___Esca_(Black_Measles)': {
                'crop': 'Grape',
                'disease': 'Esca (Black Measles)',
                'severity': 'High',
                'description': 'Complex fungal disease causing leaf discoloration and fruit spotting'
            },
            'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
                'crop': 'Grape',
                'disease': 'Leaf Blight',
                'severity': 'Moderate',
                'description': 'Fungal disease causing brown spots with yellow halos on leaves'
            },
            'Grape___healthy': {
                'crop': 'Grape',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Orange diseases
            'Orange___Haunglongbing_(Citrus_greening)': {
                'crop': 'Orange',
                'disease': 'Huanglongbing (Citrus Greening)',
                'severity': 'High',
                'description': 'Bacterial disease causing yellowing, stunting, and bitter fruit'
            },
            
            # Peach diseases
            'Peach___Bacterial_spot': {
                'crop': 'Peach',
                'disease': 'Bacterial Spot',
                'severity': 'High',
                'description': 'Bacterial disease causing dark spots on leaves and fruit'
            },
            'Peach___healthy': {
                'crop': 'Peach',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Pepper diseases
            'Pepper,_bell___Bacterial_spot': {
                'crop': 'Bell Pepper',
                'disease': 'Bacterial Spot',
                'severity': 'High',
                'description': 'Bacterial disease causing dark spots on leaves and fruit'
            },
            'Pepper,_bell___healthy': {
                'crop': 'Bell Pepper',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Potato diseases
            'Potato___Early_blight': {
                'crop': 'Potato',
                'disease': 'Early Blight',
                'severity': 'Moderate',
                'description': 'Fungal disease causing brown spots with concentric rings'
            },
            'Potato___Late_blight': {
                'crop': 'Potato',
                'disease': 'Late Blight',
                'severity': 'High',
                'description': 'Fungal disease causing water-soaked lesions'
            },
            'Potato___healthy': {
                'crop': 'Potato',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Raspberry
            'Raspberry___healthy': {
                'crop': 'Raspberry',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Soybean
            'Soybean___healthy': {
                'crop': 'Soybean',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Squash diseases
            'Squash___Powdery_mildew': {
                'crop': 'Squash',
                'disease': 'Powdery Mildew',
                'severity': 'Moderate',
                'description': 'Fungal disease causing white powdery coating on leaves'
            },
            
            # Strawberry diseases
            'Strawberry___Leaf_scorch': {
                'crop': 'Strawberry',
                'disease': 'Leaf Scorch',
                'severity': 'Moderate',
                'description': 'Fungal disease causing reddish-purple spots on leaves'
            },
            'Strawberry___healthy': {
                'crop': 'Strawberry',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            },
            
            # Tomato diseases
            'Tomato___Bacterial_spot': {
                'crop': 'Tomato',
                'disease': 'Bacterial Spot',
                'severity': 'High',
                'description': 'Bacterial disease causing dark spots on leaves and fruit'
            },
            'Tomato___Early_blight': {
                'crop': 'Tomato',
                'disease': 'Early Blight',
                'severity': 'Moderate',
                'description': 'Fungal disease causing brown spots with concentric rings'
            },
            'Tomato___Late_blight': {
                'crop': 'Tomato',
                'disease': 'Late Blight',
                'severity': 'High',
                'description': 'Fungal disease causing water-soaked lesions on leaves'
            },
            'Tomato___Leaf_Mold': {
                'crop': 'Tomato',
                'disease': 'Leaf Mold',
                'severity': 'Moderate',
                'description': 'Fungal disease causing yellow spots on upper leaf surface'
            },
            'Tomato___Septoria_leaf_spot': {
                'crop': 'Tomato',
                'disease': 'Septoria Leaf Spot',
                'severity': 'Moderate',
                'description': 'Fungal disease causing small circular spots with dark borders'
            },
            'Tomato___Spider_mites Two-spotted_spider_mite': {
                'crop': 'Tomato',
                'disease': 'Spider Mites',
                'severity': 'Moderate',
                'description': 'Pest causing stippling and webbing on leaves'
            },
            'Tomato___Target_Spot': {
                'crop': 'Tomato',
                'disease': 'Target Spot',
                'severity': 'Moderate',
                'description': 'Fungal disease causing concentric ring patterns on leaves'
            },
            'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
                'crop': 'Tomato',
                'disease': 'Yellow Leaf Curl Virus',
                'severity': 'High',
                'description': 'Viral disease causing leaf yellowing and curling'
            },
            'Tomato___Tomato_mosaic_virus': {
                'crop': 'Tomato',
                'disease': 'Mosaic Virus',
                'severity': 'High',
                'description': 'Viral disease causing mottled patterns on leaves'
            },
            'Tomato___healthy': {
                'crop': 'Tomato',
                'disease': 'Healthy',
                'severity': 'None',
                'description': 'Plant appears healthy with no visible disease symptoms'
            }
        }
    
    def create_model(self) -> keras.Model:
        """
        Create CNN model using transfer learning with MobileNetV2.
        
        Returns:
            Compiled Keras model
        """
        # Load pre-trained MobileNetV2 model
        base_model = MobileNetV2(
            weights='imagenet',
            include_top=False,
            input_shape=self.input_shape
        )
        
        # Freeze base model layers
        base_model.trainable = False
        
        # Add custom classification head
        model = models.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.3),
            layers.Dense(512, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.5),
            layers.Dense(256, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        logger.info(f"Model created with {self.num_classes} classes")
        return model
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for model prediction.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Preprocessed image array
        """
        try:
            # Load and resize image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image from {image_path}")
            
            # Convert BGR to RGB
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Resize to model input size
            image = cv2.resize(image, (self.input_shape[1], self.input_shape[0]))
            
            # Normalize pixel values
            image = image.astype(np.float32) / 255.0
            
            # Add batch dimension
            image = np.expand_dims(image, axis=0)
            
            return image
            
        except Exception as e:
            logger.error(f"Error preprocessing image {image_path}: {str(e)}")
            raise
    
    def predict_disease(self, image_path: str, top_k: int = 3) -> Dict:
        """
        Predict disease from image.
        
        Args:
            image_path: Path to the image file
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary containing predictions and disease information
        """
        if self.model is None:
            raise ValueError("Model not loaded. Please load a trained model first.")
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_path)
            
            # Make prediction - handle both SavedModel and Keras model formats
            if hasattr(self, '_inference_fn'):
                # SavedModel format
                input_tensor = tf.convert_to_tensor(processed_image)
                predictions = self._inference_fn(input_tensor)
                # Extract predictions from the output dictionary
                predictions = list(predictions.values())[0].numpy()
            else:
                # Regular Keras model
                predictions = self.model.predict(processed_image, verbose=0)
            
            # Get top k predictions
            top_indices = np.argsort(predictions[0])[-top_k:][::-1]
            top_probabilities = predictions[0][top_indices]
            
            results = []
            for i, (idx, prob) in enumerate(zip(top_indices, top_probabilities)):
                class_name = self.class_names[idx] if idx < len(self.class_names) else f"Class_{idx}"
                disease_info = self.disease_info.get(class_name, {
                    'crop': 'Unknown',
                    'disease': class_name,
                    'severity': 'Unknown',
                    'description': 'Disease information not available'
                })
                
                results.append({
                    'rank': i + 1,
                    'class_name': class_name,
                    'confidence': float(prob),
                    'crop': disease_info['crop'],
                    'disease': disease_info['disease'],
                    'severity': disease_info['severity'],
                    'description': disease_info['description']
                })
            
            return {
                'success': True,
                'predictions': results,
                'primary_prediction': results[0] if results else None
            }
            
        except Exception as e:
            logger.error(f"Error predicting disease: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'predictions': [],
                'primary_prediction': None
            }
    
    def save_model(self, model_path: str, class_names: List[str] = None):
        """
        Save trained model and class names.
        
        Args:
            model_path: Path to save the model
            class_names: List of class names
        """
        if self.model is None:
            raise ValueError("No model to save")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save model
        self.model.save(model_path)
        
        # Save class names and disease info
        metadata = {
            'class_names': class_names or self.class_names,
            'disease_info': self.disease_info,
            'input_shape': self.input_shape,
            'num_classes': self.num_classes
        }
        
        metadata_path = model_path.replace('.h5', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        self.model_path = model_path
        logger.info(f"Model saved to {model_path}")
    
    def load_model(self, model_path: str):
        """
        Load trained model and metadata.
        
        Args:
            model_path: Path to the saved model
        """
        try:
            # Check if it's a SavedModel directory or .h5/.keras file
            if os.path.isdir(model_path):
                # Load SavedModel format
                self.model = tf.saved_model.load(model_path)
                # For SavedModel, we need to get the inference function
                self._inference_fn = self.model.signatures['serving_default']
                logger.info(f"SavedModel loaded from {model_path}")
                
                # Load metadata from parent directory
                parent_dir = os.path.dirname(model_path)
                metadata_path = os.path.join(parent_dir, 'disease_detection_model_metadata.json')
            else:
                # Load .h5 or .keras format
                self.model = keras.models.load_model(model_path)
                logger.info(f"Keras model loaded from {model_path}")
                
                # Load metadata
                metadata_path = model_path.replace('.h5', '_metadata.json').replace('.keras', '_metadata.json')
            
            # Load metadata if available
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                
                self.class_names = metadata.get('class_names', [])
                self.disease_info.update(metadata.get('disease_info', {}))
                self.input_shape = tuple(metadata.get('input_shape', self.input_shape))
                self.num_classes = metadata.get('num_classes', self.num_classes)
                logger.info(f"Metadata loaded with {len(self.class_names)} classes")
            else:
                logger.warning(f"Metadata file not found at {metadata_path}")
            
            self.model_path = model_path
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def train_model(self, train_data_path: str, validation_data_path: str, 
                   epochs: int = 20, batch_size: int = 32) -> Dict:
        """
        Train the disease detection model with enhanced capabilities.
        
        Args:
            train_data_path: Path to training data directory
            validation_data_path: Path to validation data directory
            epochs: Number of training epochs
            batch_size: Batch size for training
            
        Returns:
            Training history dictionary
        """
        try:
            # Configure GPU/CPU for optimal performance
            gpus = tf.config.list_physical_devices('GPU')
            if gpus:
                logger.info(f"Training on GPU: {gpus[0].name}")
                # Enable memory growth to avoid allocating all GPU memory at once
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
            else:
                logger.info("Training on CPU")
                # Set CPU threads for better performance
                tf.config.threading.set_intra_op_parallelism_threads(0)
                tf.config.threading.set_inter_op_parallelism_threads(0)
        except Exception as e:
            logger.warning(f"GPU configuration failed: {e}")
        
        if self.model is None:
            self.create_model()
        
        # Enhanced data augmentation for better generalization
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.15,
            zoom_range=0.2,
            horizontal_flip=True,
            brightness_range=[0.8, 1.2],
            fill_mode='nearest',
            validation_split=0.2 if validation_data_path is None else 0.0
        )
        
        # Validation data generator (no augmentation)
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        # Training data generator with shuffle
        train_generator = train_datagen.flow_from_directory(
            train_data_path,
            target_size=(self.input_shape[0], self.input_shape[1]),
            batch_size=batch_size,
            class_mode='categorical',
            shuffle=True,
            seed=42,
            subset='training' if validation_data_path is None else None
        )
        
        # Validation data generator
        if validation_data_path:
            validation_generator = val_datagen.flow_from_directory(
                validation_data_path,
                target_size=(self.input_shape[0], self.input_shape[1]),
                batch_size=batch_size,
                class_mode='categorical',
                shuffle=False  # Don't shuffle validation data
            )
        else:
            validation_generator = train_datagen.flow_from_directory(
                train_data_path,
                target_size=(self.input_shape[0], self.input_shape[1]),
                batch_size=batch_size,
                class_mode='categorical',
                shuffle=False,
                seed=42,
                subset='validation'
            )
        
        # Store class names and update model if needed
        self.class_names = list(train_generator.class_indices.keys())
        actual_num_classes = len(self.class_names)
        
        # Verify model has correct number of classes
        if actual_num_classes != self.num_classes:
            logger.warning(f"Model expects {self.num_classes} classes but found {actual_num_classes}")
            logger.info(f"Recreating model with {actual_num_classes} classes")
            self.num_classes = actual_num_classes
            self.create_model()
        
        logger.info(f"Training with {actual_num_classes} classes:")
        for i, class_name in enumerate(self.class_names[:10]):  # Show first 10
            logger.info(f"  {i}: {class_name}")
        if len(self.class_names) > 10:
            logger.info(f"  ... and {len(self.class_names) - 10} more classes")
        
        # Enhanced callbacks for better training
        callbacks = [
            EarlyStopping(
                monitor='val_accuracy',
                patience=8,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.3,
                patience=4,
                min_lr=1e-7,
                verbose=1
            ),
            ModelCheckpoint(
                'best_disease_model_checkpoint.h5',
                save_best_only=True,
                monitor='val_accuracy',
                mode='max',
                verbose=1
            )
        ]
        
        # Calculate steps per epoch
        steps_per_epoch = train_generator.samples // batch_size
        validation_steps = validation_generator.samples // batch_size
        
        logger.info(f"Training configuration:")
        logger.info(f"  • Training samples: {train_generator.samples:,}")
        logger.info(f"  • Validation samples: {validation_generator.samples:,}")
        logger.info(f"  • Steps per epoch: {steps_per_epoch}")
        logger.info(f"  • Validation steps: {validation_steps}")
        logger.info(f"  • Batch size: {batch_size}")
        logger.info(f"  • Epochs: {epochs}")
        
        # Train model with progress tracking
        logger.info("🔥 Starting model training...")
        history = self.model.fit(
            train_generator,
            steps_per_epoch=steps_per_epoch,
            epochs=epochs,
            validation_data=validation_generator,
            validation_steps=validation_steps,
            callbacks=callbacks,
            verbose=1
        )
        
        logger.info("✅ Training completed successfully")
        
        # Load best weights if checkpoint was created
        try:
            if os.path.exists('best_disease_model_checkpoint.h5'):
                logger.info("📥 Loading best model weights from checkpoint")
                self.model.load_weights('best_disease_model_checkpoint.h5')
                # Clean up checkpoint file
                os.remove('best_disease_model_checkpoint.h5')
        except Exception as e:
            logger.warning(f"Could not load checkpoint: {e}")
        
        return history.history
    
    def evaluate_model(self, test_data_path: str, batch_size: int = 32) -> Dict:
        """
        Evaluate the trained model on test data.
        
        Args:
            test_data_path: Path to test data directory
            batch_size: Batch size for evaluation
            
        Returns:
            Dictionary containing evaluation metrics
        """
        if self.model is None:
            raise ValueError("Model not loaded. Please load a trained model first.")
        
        try:
            from sklearn.metrics import classification_report, confusion_matrix
            import matplotlib.pyplot as plt
            import seaborn as sns
            
            # Test data generator (no augmentation)
            test_datagen = ImageDataGenerator(rescale=1./255)
            
            test_generator = test_datagen.flow_from_directory(
                test_data_path,
                target_size=(self.input_shape[0], self.input_shape[1]),
                batch_size=batch_size,
                class_mode='categorical',
                shuffle=False  # Important for consistent evaluation
            )
            
            logger.info(f"Evaluating model on {test_generator.samples} test samples...")
            
            # Get predictions
            predictions = self.model.predict(test_generator, verbose=1)
            predicted_classes = np.argmax(predictions, axis=1)
            
            # Get true labels
            true_classes = test_generator.classes
            class_labels = list(test_generator.class_indices.keys())
            
            # Calculate metrics
            test_loss, test_accuracy = self.model.evaluate(test_generator, verbose=0)
            
            # Classification report
            class_report = classification_report(
                true_classes, 
                predicted_classes, 
                target_names=class_labels,
                output_dict=True
            )
            
            # Confusion matrix
            conf_matrix = confusion_matrix(true_classes, predicted_classes)
            
            # Per-class accuracy
            per_class_accuracy = {}
            for i, class_name in enumerate(class_labels):
                class_mask = (true_classes == i)
                if np.sum(class_mask) > 0:
                    class_acc = np.sum((predicted_classes == i) & class_mask) / np.sum(class_mask)
                    per_class_accuracy[class_name] = float(class_acc)
            
            # Top-k accuracy (top-3)
            top3_predictions = np.argsort(predictions, axis=1)[:, -3:]
            top3_accuracy = np.mean([true_classes[i] in top3_predictions[i] for i in range(len(true_classes))])
            
            evaluation_results = {
                'test_accuracy': float(test_accuracy),
                'test_loss': float(test_loss),
                'top3_accuracy': float(top3_accuracy),
                'per_class_accuracy': per_class_accuracy,
                'classification_report': class_report,
                'confusion_matrix': conf_matrix.tolist(),
                'class_labels': class_labels,
                'total_samples': int(test_generator.samples)
            }
            
            logger.info(f"✅ Model evaluation completed")
            logger.info(f"📊 Test Accuracy: {test_accuracy:.3f}")
            logger.info(f"📊 Test Loss: {test_loss:.3f}")
            logger.info(f"📊 Top-3 Accuracy: {top3_accuracy:.3f}")
            
            # Show best and worst performing classes
            sorted_classes = sorted(per_class_accuracy.items(), key=lambda x: x[1], reverse=True)
            logger.info(f"🏆 Best performing classes:")
            for class_name, acc in sorted_classes[:5]:
                logger.info(f"   • {class_name}: {acc:.3f}")
            
            logger.info(f"⚠️ Worst performing classes:")
            for class_name, acc in sorted_classes[-5:]:
                logger.info(f"   • {class_name}: {acc:.3f}")
            
            return evaluation_results
            
        except Exception as e:
            logger.error(f"Error during model evaluation: {str(e)}")
            raise

def create_sample_model():
    """
    Create a sample pre-trained model for demonstration purposes.
    This would normally be replaced with a properly trained model.
    """
    model = DiseaseDetectionModel()
    model.create_model()
    
    # Set all 38 PlantVillage class names
    model.class_names = [
        'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
        'Blueberry___healthy',
        'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
        'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
        'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
        'Orange___Haunglongbing_(Citrus_greening)',
        'Peach___Bacterial_spot', 'Peach___healthy',
        'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy',
        'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
        'Raspberry___healthy',
        'Soybean___healthy',
        'Squash___Powdery_mildew',
        'Strawberry___Leaf_scorch', 'Strawberry___healthy',
        'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
        'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
        'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
    ]
    
    return model

if __name__ == "__main__":
    # Example usage
    model = create_sample_model()
    
    # Save the sample model
    model_dir = Path("../model")
    model_dir.mkdir(exist_ok=True)
    model.save_model(str(model_dir / "disease_detection_model.h5"), model.class_names)
    
    print("Sample disease detection model created and saved!")
