from datetime import datetime
from app.extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

caso_estudiantes = db.Table('caso_estudiantes',
    db.Column('caso_id', db.Integer, db.ForeignKey('caso.caso_id'), primary_key=True),
    db.Column('estudiante_id', db.Integer, db.ForeignKey('estudiante.estudiante_id'), primary_key=True)
)

user_paralelos = db.Table('user_paralelos',
    db.Column('user_id', db.Integer, db.ForeignKey('user.user_id'), primary_key=True),
    db.Column('paralelo_id', db.Integer, db.ForeignKey('paralelo.paralelo_id'), primary_key=True)
)


class Rol(db.Model):
    rol_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    descripcion = db.Column(db.String(200))

class Sede(db.Model):
    sede_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    paralelos = db.relationship('Paralelo', backref='sede', lazy=True)

class Paralelo(db.Model):
    paralelo_id = db.Column(db.Integer, primary_key=True)
    sigla_paralelo = db.Column(db.String(200), nullable=False)
    sede_id = db.Column(db.Integer, db.ForeignKey('sede.sede_id'), nullable=True)
    
    usuarios = db.relationship('User', secondary=user_paralelos, backref='paralelos')

class User(db.Model, UserMixin):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    rol_id = db.Column(db.Integer, db.ForeignKey('rol.rol_id'), nullable=False)
    

    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def get_id(self):
        return str(self.user_id)

class Reporte(db.Model):
    reporte_id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    
    casos = db.relationship('Caso', backref='reporte', lazy=True)

class Caso(db.Model):
    caso_id = db.Column(db.Integer, primary_key=True)
    reporte_id = db.Column(db.Integer, db.ForeignKey('reporte.reporte_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=True)  
    
    similitud = db.Column(db.Float, nullable=False)   
    lineas = db.Column(db.Integer, nullable=True)     
    url_moss = db.Column(db.String(500), nullable=True) 
    
    estado = db.Column(db.String(50), default='Pendiente')
    
    involucrados = db.relationship('Estudiante', secondary=caso_estudiantes, backref='casos')
    usuario_asignado = db.relationship('User', backref='casos_asignados', foreign_keys=[user_id])

class Estudiante(db.Model):
    estudiante_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)    
    apellido = db.Column(db.String(150), nullable=True)   
    rol_usm = db.Column(db.String(20), unique=True, nullable=False) 
    paralelo_id = db.Column(db.Integer, db.ForeignKey('paralelo.paralelo_id'), nullable=True)
    
    paralelo = db.relationship('Paralelo', backref='estudiantes')