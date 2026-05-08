export interface IContratoSecop {
    nombre_entidad: string;
    nit_entidad: string;
    departamento: string;
    ciudad: string;
    estado_contrato: string;
    tipo_de_contrato: string;
    valor_del_contrato: number;
    fecha_de_firma: string;
    objeto_del_contrato: string;
    [key: string]: any;
}

export interface SOQLQuery {
    $select?: string;
    $where?: string;
    $order?: string;
    $limit?: string;
    $offset?: string;
    [key: string]: any;
}